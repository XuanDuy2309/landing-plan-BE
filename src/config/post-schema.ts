import { z } from "zod";
import { Purpose_Post, Type_Asset_Enum } from "../models";

// Base schema
export const postSchema = z.object({
    id: z.number().optional(),
    type: z.number().optional(),
    purpose: z.nativeEnum(Purpose_Post),
    type_asset: z.nativeEnum(Type_Asset_Enum),
    status: z.number().optional(),

    image_links: z.string().min(1, "Vui lòng chọn hình ảnh"),
    video_links: z.string().optional(),

    coordinates: z.string().min(3, "Vui lòng nhập tọa độ"),

    direction_land: z.number().optional(),

    area: z.number({
        required_error: "Vui lòng nhập diện tích",
        invalid_type_error: "Diện tích không hợp lệ"
    }),

    price_for_buy: z.number().optional(),
    price_for_rent: z.number().optional(),

    price_start: z.number().optional(),
    price_current: z.number().optional(),
    bid_step: z.number().optional(),
    max_bid: z.number().optional(),

    start_date: z.string().optional(),
    end_date: z.string().optional(),

    number_floors: z.number().optional(),
    number_bedrooms: z.number().optional(),
    number_bathrooms: z.number().optional(),

    room_number: z.number().optional(),
    in_alley: z.number().optional(),

    title: z.string().min(1, "Vui lòng nhập tiêu đề"),
    description: z.string().optional(),

    lng: z.number({ required_error: "Vui lòng nhập kinh độ" }),
    lat: z.number({ required_error: "Vui lòng nhập vĩ độ" }),

    address: z.string().optional(),

    owner_name: z.string().optional(),
    owner_phone: z.string().optional(),

    group_id: z.number().optional(),
    create_by_id: z.number().optional(),
});

// Extended refine validation
export const postSchemaWithRules = postSchema.superRefine((data, ctx) => {
    // ✅ Validate theo Purpose
    if (data.purpose === Purpose_Post.For_Rent && !data.price_for_rent) {
        ctx.addIssue({
            path: ["price_for_rent"],
            code: z.ZodIssueCode.custom,
            message: "Vui lòng nhập giá trị thuê"
        });
    }

    if (data.purpose === Purpose_Post.For_Auction) {
        if (!data.price_start) {
            ctx.addIssue({
                path: ["price_start"],
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập giá khởi điểm"
            });
        }
        if (!data.bid_step) {
            ctx.addIssue({
                path: ["bid_step"],
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập bước giá"
            });
        }
        if (!data.start_date) {
            ctx.addIssue({
                path: ["start_date"],
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập ngày bắt đầu"
            });
        }
        if (!data.end_date) {
            ctx.addIssue({
                path: ["end_date"],
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập ngày kết thúc"
            });
        }
    }

    // ✅ Validate theo loại tài sản
    const hasRoomInfo = [
        Type_Asset_Enum.Home,
        Type_Asset_Enum.Apartment,
        Type_Asset_Enum.Office,
        Type_Asset_Enum.Other,
        Type_Asset_Enum.Motel,
        Type_Asset_Enum.Hotel,
    ].includes(data.type_asset);

    if (hasRoomInfo) {
        if (!data.number_floors) {
            ctx.addIssue({
                path: ["number_floors"],
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập số tầng"
            });
        }
        if (!data.number_bedrooms) {
            ctx.addIssue({
                path: ["number_bedrooms"],
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập số phòng ngủ"
            });
        }
        if (!data.number_bathrooms) {
            ctx.addIssue({
                path: ["number_bathrooms"],
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập số phòng tắm"
            });
        }
    }
});
