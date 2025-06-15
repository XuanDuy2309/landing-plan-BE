-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:8889
-- Thời gian đã tạo: Th6 14, 2025 lúc 09:46 AM
-- Phiên bản máy phục vụ: 8.0.40
-- Phiên bản PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `landing_plan`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `land_zones`
--

CREATE TABLE `land_zones` (
  `id` int NOT NULL,
  `type_landing_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `coordinates` polygon NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `land_zones`
--
ALTER TABLE `land_zones`
  ADD PRIMARY KEY (`id`),
  ADD SPATIAL KEY `coordinates` (`coordinates`),
  ADD KEY `type_landing_id` (`type_landing_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `land_zones`
--
ALTER TABLE `land_zones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `land_zones`
--
ALTER TABLE `land_zones`
  ADD CONSTRAINT `land_zones_ibfk_1` FOREIGN KEY (`type_landing_id`) REFERENCES `land_types` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
