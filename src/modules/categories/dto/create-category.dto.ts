import { StringField } from 'src/common/decorators/field-validators.decorator';

export class CreateCategoryDto {
  @StringField('Tên danh mục', { min: 2, max: 64 })
  name: string;
}
