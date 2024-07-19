CREATE TABLE Complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    shift ENUM('A', 'B', 'C', 'G') NOT NULL,
    complaint_description TEXT,
    reported_date DATE NOT NULL,
    reported_time TIME NOT NULL,
    action_taken TEXT,
    close_date DATE NOT NULL,
    close_time TIME NOT NULL,
    complaint_status ENUM('new','open', 'close') NOT NULL
);
select * from complaints;