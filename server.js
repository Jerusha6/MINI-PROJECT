// Required dependencies
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const db = require("./db");
const bcrypt = require("bcrypt");
const moment = require("moment-timezone");
const session = require("express-session");
const router = express.Router();
const port = 3000;

moment.tz.setDefault("Asia/Kolkata");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "docs"));
app.disable("etag");

app.post("/api/register", async (req, res) => {
  const { fname, lname, contact, email, password, repassword, gender } =
    req.body;
  if (password !== repassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  try {
    db.query(
      "SELECT * FROM user_data WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
          return res.status(400).json({ error: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql =
          "INSERT INTO user_data (firstname, lastname, email, contact, gen, pass, repass) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(
          sql,
          [
            fname,
            lname,
            email,
            contact,
            gender,
            hashedPassword,
            hashedPassword,
          ],
          (err, results) => {
            if (err) {
              console.error("Database insertion error:", err);
              return res.status(500).json({ error: "Database error" });
            }
            res.status(201).json({
              id: results.insertId,
              redirectUrl: "/signin.html",
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//Endpoint for login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await verifyUser(email, password);

    if (user) {
      // Generate a simple token (in a real-world scenario, use a more secure method like JWT)
      const token = Buffer.from(user.id + ":" + Date.now()).toString("base64");

      res.json({
        success: true,
        message: "Login successful",
        redirectUrl: "/home.html",
        token: token,
        userId: user.id,
      });
    } else {
      // Authentication failed
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "An error occurred during login" });
  }
});
async function verifyUser(email, password) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM user_data WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return reject(err);
      }

      if (results.length === 0) {
        // No user found with this email
        return resolve(null);
      }

      const user = results[0];

      try {
        const passwordMatch = await bcrypt.compare(password, user.pass);

        if (passwordMatch) {
          const { pass, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } else {
          resolve(null);
        }
      } catch (bcryptErr) {
        console.error("Bcrypt compare error:", bcryptErr);
        reject(bcryptErr);
      }
    });
  });
}

//Endpoint for logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Could not log out, please try again" });
    }
    res.json({ success: true });
  });
});

app.get("/api/check-auth", (req, res) => {
  res.json({ isLoggedIn: !!req.session.userId });
});

app.post("/submit", (req, res) => {
  const {
    date,
    shift,
    shift_engineer,
    appserver,
    appserverRemarks,
    dbserver,
    dbserverRemarks,
    firewall1Status,
    firewall1Remarks,
    firewall2Status,
    firewall2Remarks,
    hhtUp,
    hhtDown,
    hhtRemarks,
    GPS,
    gpsRemarks,
    WAC,
    wacRemarks,
    UPS,
    upsRemarks,
    apsUp,
    apsDown,
    apsRemarks,
    otherRemarks,
  } = req.body;
  const sql = `INSERT INTO logsheets (log_date, shift, shift_engineer, app_server_status, app_server_remarks, 
    db_server_status, db_server_remarks, firewall1_status, firewall1_remarks, firewall2_status, firewall2_remarks,
     hht_up, hht_down, hht_remarks, gps_status, gps_remarks, wac_status, wac_remarks, ups_status, ups_remarks, aps_up, 
     aps_down, aps_remarks, other_remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      date,
      shift,
      shift_engineer,
      appserver,
      appserverRemarks,
      dbserver,
      dbserverRemarks,
      firewall1Status,
      firewall1Remarks,
      firewall2Status,
      firewall2Remarks,
      hhtUp,
      hhtDown,
      hhtRemarks,
      GPS,
      gpsRemarks,
      WAC,
      wacRemarks,
      UPS,
      upsRemarks,
      apsUp,
      apsDown,
      apsRemarks,
      otherRemarks,
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ error: "Error submitting logsheet" });
      res.json({ message: "Logsheet submitted successfully!" });
    }
  );
});


// Get user profile
app.get("/api/profile", (req, res) => {
  db.query(
    "SELECT fname, lname, contact, email, gender FROM user_data WHERE id = ?",
    [req.session.userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    }
  );
});

// Update user profile
app.put("/api/updateprofile", async (req, res) => {
  const { fname, lname, contact, gender, password } = req.body;
  try {
    let query =
      "UPDATE users SET fname = $1, lname = $2, contact = $3, gender = $4";
    let values = [fname, lname, contact, gender];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ", password = $5 WHERE id = $6";
      values.push(hashedPassword, req.session.userId);
    } else {
      query += " WHERE id = $5";
      values.push(req.session.userId);
    }

    await pool.query(query, values);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



app.post("/submit-complaint", (req, res) => {
  const {
    date,
    shift,
    complaintDescription,
    reportedDate,
    reportedTime,
    actionTaken,
    closeDate,
    closeTime,
    complaintStatus,
  } = req.body;
  const sql = `INSERT INTO complaints (date, shift, complaint_description, reported_date, reported_time, action_taken, close_date, close_time, complaint_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      date,
      shift,
      complaintDescription,
      reportedDate,
      reportedTime,
      actionTaken,
      closeDate,
      closeTime,
      complaintStatus,
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ error: "Error submitting complaint" });
      res.json({ message: "Complaint submitted successfully!" });
    }
  );
});

// Endpoint for fetching all comlplaint data
app.get("/api/complaints", (req, res) => {
  const sql = "SELECT * FROM complaints";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching complaints:", err);
      return res.status(500).json({ error: "Error fetching complaints" });
    }
    res.json(results);
  });
});

app.get("/api/complaints/:date/:shift", (req, res) => {
  const sql =
    "SELECT * FROM complaints WHERE DATE(date) = ? AND shift = ?";
   db.query(sql, [date, shift], (err, results) => {
    if (err) return res.status(500).json({ error: "Error fetching complaint" });
     if (results.length === 0) {
       // Return an empty object instead of 404
       return res.json({});
     }
     res.json(results[0]);
   });
});

// Endpoint for fetching all log sheet data
app.get("/api/logsheets", (req, res) => {
  const sql = "SELECT * FROM logsheets";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching logs:", err);
      return res.status(500).json({ error: "Error fetching logs" });
    }
    res.json(results);
  });
});
app.get("/api/logs/:date/:shift", (req, res) => {
  const { date, shift } = req.params;
  const sql = "SELECT * FROM logsheets WHERE DATE(log_date) = ? AND shift = ?";
  db.query(sql, [date, shift], (err, results) => {
    if (err) return res.status(500).json({ error: "Error fetching log entry" });
    if (results.length === 0) {
      // Return an empty object instead of 404
      return res.json({});
    }
    res.json(results[0]);
  });
});

app.delete("/api/removecomplaint/:date/:shift", (req, res) => {
  const { date, shift } = req.params;
  const sql = "DELETE FROM complaints WHERE DATE(date) = ? AND shift = ?";
  db.query(sql, [date, shift], (err, result) => {
    if (err) {
      console.error("Error deleting complaint:", err);
      return res.status(500).json({ error: "Error deleting complaint entry" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Complaint entry not found" });
    }
    res.json({ message: "Complaint deleted successfully" });
  });
});

app.delete("/api/removelog/:date/:shift", (req, res) => {
  const { date, shift } = req.params;
  const sql = "DELETE FROM logsheets WHERE DATE(log_date) = ? AND shift = ?";
  db.query(sql, [date, shift], (err, result) => {
    if (err) {
      console.error("Error deleting log:", err);
      return res.status(500).json({ error: "Error deleting log entry" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Log entry not found" });
    }
  });
});

app.put("/api/updatelog", (req, res) => {
  const {
    log_date,
    shift,
    shift_engineer,
    app_server_status,
    app_server_remarks,
    db_server_status,
    db_server_remarks,
    firewall1_status,
    firewall1_remarks,
    firewall2_status,
    firewall2_remarks,
    hht_up,
    hht_down,
    hht_remarks,
    gps_status,
    gps_remarks,
    wac_status,
    wac_remarks,
    ups_status,
    ups_remarks,
    aps_up,
    aps_down,
    aps_remarks,
    other_remarks,
  } = req.body;

  const sql = `
    UPDATE logsheets SET 
      shift_engineer = ?, app_server_status = ?, app_server_remarks = ?, db_server_status = ?, db_server_remarks = ?, 
      firewall1_status = ?, firewall1_remarks = ?, firewall2_status = ?, firewall2_remarks = ?, hht_up = ?, hht_down = ?, 
      hht_remarks = ?, gps_status = ?, gps_remarks = ?, wac_status = ?, wac_remarks = ?, ups_status = ?, ups_remarks = ?, 
      aps_up = ?, aps_down = ?, aps_remarks = ?, other_remarks = ?
    WHERE DATE(log_date) = ? AND shift = ?`;

  db.query(
    sql,
    [
      shift_engineer,
      app_server_status,
      app_server_remarks,
      db_server_status,
      db_server_remarks,
      firewall1_status,
      firewall1_remarks,
      firewall2_status,
      firewall2_remarks,
      hht_up,
      hht_down,
      hht_remarks,
      gps_status,
      gps_remarks,
      wac_status,
      wac_remarks,
      ups_status,
      ups_remarks,
      aps_up,
      aps_down,
      aps_remarks,
      other_remarks,
      log_date,
      shift,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating log:", err);
        return res.status(500).json({ error: "Error updating log" });
      }
      res.json({ message: "Log updated successfully" });
    }
  );
});
app.put("/api/updatecomplaint", (req, res) => {    
  const {
    date,
    shift,
    complaintDescription: complaint_description,
    reportedDate: reported_date,
    reportedTime: reported_time,
    actionTaken: action_taken,
    closeDate: close_date,
    closeTime: close_time,
    complaintStatus: complaint_status,
  } = req.body;

  const sql = `
    UPDATE complaints 
    SET complaint_description = ?, reported_date = ?, reported_time = ?, 
        action_taken = ?, close_date = ?, close_time = ?, complaint_status = ?
    WHERE DATE(date) = ? AND shift = ?`;

  db.query(
    sql,
    [
      complaint_description,
      reported_date,
      reported_time,
      action_taken,
      close_date,
      close_time,
      complaint_status,
      date,
      shift,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating complaint:", err);
        return res.status(500).json({
          error: "Error updating complaint",
          details: err.message,
          sqlMessage: err.sqlMessage,
        });
      }
        res.json({ message: "Complaint updated successfully" });
    
    }
    
  );
});
router.get("/api/clearform", (req, res) => {
  const clearFormData = {
    shift_engineer: "",
    app_server_status: "",
    app_server_remarks: "",
    db_server_status: "",
    db_server_remarks: "",
    firewall1_status: "",
    firewall1_remarks: "",
    firewall2_status: "",
    firewall2_remarks: "",
    hht_up: "",
    hht_down: "",
    hht_remarks: "",
    gps_status: "",
    gps_remarks: "",
    wac_status: "",
    wac_remarks: "",
    ups_status: "",
    ups_remarks: "",
    aps_up: "",
    aps_down: "",
    aps_remarks: "",
    other_remarks: "",
  };

  res.json(clearFormData);
});

module.exports = router;

app.get("/api/complaint/:id", (req, res) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    return res.status(400).json({ error: "Invalid complaint ID" });
  }

  const sql = "SELECT * FROM complaints WHERE id = ?";

  db.query(sql, [numericId], (err, results) => {
    if (err) {
      console.error("Error fetching complaint:", err);
      return res.status(500).json({ error: "Error fetching complaint" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json(results[0]);
  });
});

app.get("/api/complaintdetails", (req, res) => {
  const { date, shift } = req.query;

  const sql = "SELECT * FROM complaints WHERE DATE(date) = ? AND shift = ?";
  db.query(sql, [date, shift], (err, results) => {
    if (err) {
      console.error("Error fetching complaint details:", err);
      return res
        .status(500)
        .json({ error: "Error fetching complaint details" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No complaint found for the given date and shift" });
    }

    const complaint = {
      date: results[0].date || null,
      shift: results[0].shift || null,
      complaintDescription: results[0].complaint_description || null,
      reportedDate: results[0].reported_date || null,
      reportedTime: results[0].reported_time || null,
      actionTaken: results[0].action_taken || null,
      closeDate: results[0].close_date || null,
      closeTime: results[0].close_time || null,
      complaintStatus: results[0].complaint_status || null,
    };

    res.json(complaint);
  });
});

app.get("/api/logdetails", (req, res) => {
  const { date, shift } = req.query;

  const sql = "SELECT * FROM logsheets WHERE DATE(log_date) = ? AND shift = ?";
  db.query(sql, [date, shift], (err, results) => {
    if (err) {
      console.error("Error fetching log details:", err);
      return res.status(500).json({ error: "Error fetching log details" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No log found for the given date and shift" });
    }

    const log = {
      date: results[0].log_date || null,
      shift: results[0].shift || null,
      shift_engineer: results[0].shift_engineer || null,
      appserver: results[0].app_server_status || null,
      appserverRemarks: results[0].app_server_remarks || null,
      dbserver: results[0].db_server_status || null,
      dbserverRemarks: results[0].db_server_remarks || null,
      firewall1Status: results[0].firewall1_status || null,
      firewall1Remarks: results[0].firewall1_remarks || null,
      firewall2Status: results[0].firewall2_status || null,
      firewall2Remarks: results[0].firewall2_remarks || null,
      hhtUp: results[0].hht_up || null,
      hhtDown: results[0].hht_down || null,
      hhtRemarks: results[0].hht_remarks || null,
      GPS: results[0].gps_status || null,
      gpsRemarks: results[0].gps_remarks || null,
      WAC: results[0].wac_status || null,
      wacRemarks: results[0].wac_remarks || null,
      UPS: results[0].ups_status || null,
      upsRemarks: results[0].ups_remarks || null,
      apsUp: results[0].aps_up || null,
      apsDown: results[0].aps_down || null,
      apsRemarks: results[0].aps_remarks || null,
      otherRemarks: results[0].other_remarks || null,
    };

    res.json(log);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "docs", "index.html"));
// });

// Start the Express server and listen on specified port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
