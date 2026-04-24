import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post as PostEntity } from 'src/model/entities/post.entity';
import { Media } from 'src/model/entities/media.entity';
import { User } from 'src/model/entities/user.entity';
import { Category } from 'src/model/entities/category.entity';
import { generateSlug } from 'src/common/helpers/slug.helper';

export class PostsHelpers {
  // ===== Load & validate quan hệ =====
  static async ensureMedia(
    mediaId: number,
    mediaRepo: Repository<Media>,
  ): Promise<Media> {
    const media = await mediaRepo.findOne({ where: { id: mediaId } });
    if (!media)
      throw new NotFoundException(`Media id=${mediaId} không tồn tại`);
    return media;
  }

  static async ensureUser(
    userId: number,
    userRepo: Repository<User>,
  ): Promise<User> {
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User id=${userId} không tồn tại`);
    return user;
  }

  static async ensureCategory(
    categoryId: number,
    catRepo: Repository<Category>,
  ): Promise<Category> {
    const cat = await catRepo.findOne({ where: { id: categoryId } });
    if (!cat)
      throw new NotFoundException(`Category id=${categoryId} không tồn tại`);
    return cat;
  }

  // ===== Slug duy nhất =====
  static async buildUniqueSlug(
    repo: Repository<PostEntity>,
    title?: string,
    inputSlug?: string,
    excludeId?: number,
  ): Promise<string> {
    const baseSource = (inputSlug && inputSlug.trim()) || (title ?? '');
    const base = generateSlug(baseSource);
    if (!base) return '';

    let candidate = base;
    let i = 1;

    // TypeORM 0.3+: getExists()
    while (true) {
      const qb = repo
        .createQueryBuilder('p')
        .where('p.slug = :slug', { slug: candidate });
      if (excludeId) qb.andWhere('p.id != :id', { id: excludeId });
      const exists = await qb.getExists();
      if (!exists) break;
      i += 1;
      candidate = `${base}-${i}`;
      if (i > 200) break; // tránh vòng lặp vô hạn
    }
    return candidate;
  }

  // ===== Geocode địa chỉ → lat/long (Nominatim) =====
  static async geocodeAddress(
    address: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    if (!address?.trim()) return null;

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      address,
    )}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'WebTraviel/1.0 (posts-module)' },
    });
    if (!res.ok) return null;

    const data: Array<{ lat: string; lon: string }> = await res.json();
    if (!data?.length) return null;

    const { lat, lon } = data[0];
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude };
  }
}
