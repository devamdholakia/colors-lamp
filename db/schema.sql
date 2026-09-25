-- schema and seed data for the COLORS application

CREATE DATABASE IF NOT EXISTS COP4331;
USE COP4331;

CREATE TABLE Users (
  ID INT NOT NULL AUTO_INCREMENT,
  FirstName VARCHAR(50) NOT NULL DEFAULT '',
  LastName VARCHAR(50) NOT NULL DEFAULT '',
  Login VARCHAR(50) NOT NULL DEFAULT '',
  Password VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (ID)
) ENGINE = InnoDB;

CREATE TABLE Colors (
  ID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(50) NOT NULL DEFAULT '',
  UserID INT NOT NULL DEFAULT '0',
  PRIMARY KEY (ID)
) ENGINE = InnoDB;

-- passwords are stored as MD5 hashes, matching what the frontend sends
INSERT INTO Users (FirstName,LastName,Login,Password) VALUES
('Aashish','Yadavally','AYadavally','5832a71366768098cceb7095efb774f2'),
('Sam','Hill','SamH','0cbc6611f5540bd0809a388dc95a615b');

INSERT INTO Colors (Name,UserID) VALUES
('Blue',1),('White',1),('Black',1),('gray',1),('Magenta',1),('Yellow',1),
('Cyan',1),('Salmon',1),('Chartreuse',1),('Lime',1),('Light Blue',1),
('Light Gray',1),('Light Red',1),('Light Green',1),('Chiffon',1),
('Fuscia',1),('Brown',1),('Beige',1);
