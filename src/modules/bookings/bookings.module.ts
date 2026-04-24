import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/model/entities/booking.entity';
import { Customer } from 'src/model/entities/customer.entity';
import { Hotel } from 'src/model/entities/hotel.entity';
import { RoomType } from 'src/model/entities/room-type.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Customer, Hotel, RoomType])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
