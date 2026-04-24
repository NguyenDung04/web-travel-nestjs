import {
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { BookingStatus } from 'src/common/constants/booking-status.enum';

export class CreateBookingDto {
  @IsString({ message: 'Mã đặt phòng phải là chuỗi ký tự' })
  booking_code: string;

  @IsNumber({}, { message: 'ID khách hàng phải là số' })
  customer_id: number;

  @IsNumber({}, { message: 'ID khách sạn phải là số' })
  hotel_id: number;

  @IsNumber({}, { message: 'ID loại phòng phải là số' })
  room_type_id: number;

  @IsDateString(
    {},
    { message: 'Ngày check-in phải đúng định dạng ngày (YYYY-MM-DD)' },
  )
  checkin_date: string;

  @IsDateString(
    {},
    { message: 'Ngày check-out phải đúng định dạng ngày (YYYY-MM-DD)' },
  )
  checkout_date: string;

  @IsNumber({}, { message: 'Số lượng người lớn phải là số' })
  adults: number;

  @IsNumber({}, { message: 'Số lượng trẻ em phải là số' })
  children: number;

  @IsNumber({}, { message: 'Tổng số tiền phải là số' })
  total_amount: number;

  @IsEnum(BookingStatus, { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: BookingStatus;
}
