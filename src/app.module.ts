import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { HotelRoomImagesModule } from './modules/hotel_room_images/hotel_room_images.module';
import { MediaModule } from './modules/media/media.module';
import { PostsModule } from './modules/posts/posts.module';
import { PostMediaModule } from './modules/post_media/post_media.module';
import { RoomInventoryModule } from './modules/room_inventory/room_inventory.module';
import { RoomTypesModule } from './modules/room_types/room_types.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SlidersModule } from './modules/sliders/sliders.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // load .env toàn cục
      // Tự chọn file theo NODE_ENV: .env.production | .env.test | .env.development
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public', // => ảnh truy cập tại /public/image/....
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    BookingsModule,
    CustomersModule,
    HotelsModule,
    HotelRoomImagesModule,
    MediaModule,
    PostsModule,
    PostMediaModule,
    RoomInventoryModule,
    RoomTypesModule,
    SettingsModule,
    SlidersModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
