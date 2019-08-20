CREATE DATABASE IF NOT EXISTS `Jikan`
USE `Jikan`

CREATE TABLE `Plans` (
  `Timestamp` varchar(24) DEFAULT NULL,
  `Message` varchar(256) DEFAULT NULL,
  `UserID` varchar(18) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Private_Plans` (
  `Timestamp` varchar(24) DEFAULT NULL,
  `Message` blob,
  `UserID` varchar(18) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Keys_` (
  `UserID` varchar(18) DEFAULT NULL,
  `PublicKey` text,
  `PrivateKey` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;