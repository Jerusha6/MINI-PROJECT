CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    pass VARCHAR(255) NOT NULL,
    repass VARCHAR(255) NOT NULL,
    gen ENUM('m', 'f', 'o') NOT NULL,
    contact bigint NOT NULL,
    reset_code VARCHAR(6)
);