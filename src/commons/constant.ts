import { SelectQueryBuilder } from "typeorm";
import { Destination } from "../entities/destination.entity";
import { Category } from "../entities/category.entity";

export class Constant {
  static resetRandomCodeString = Math.random().toString(36).substring(36);
  static JWTSecret: string = "jedJlxSecret2023";

  static randomCodeString = function (length = 6) {
    return Math.random().toString(20).substr(2, length);
  };

  static randomString = Constant.randomCodeString(7);

  static ResetCodeString = function (length = 6) {
    return Math.random().toString(20).substr(2, length);
  };
  static randomCode: any = Math.floor(Math.random() * 100000 + 1);
  static resetRandomCode: any = Math.floor(Math.random() * 100000 + 1);

  static resetString = Constant.ResetCodeString(7);
  static TAKE = 40;
  static SKIP = 0;
}

export class Filter {
  static TITLE_FILTER = function (
    title,
    query: SelectQueryBuilder<Destination>
  ) {
    if (title) query.andWhere("destination.title = :title ", { title: title });
  };
  static PRICE_FILTER = function (
    price,
    query: SelectQueryBuilder<Destination>
  ) {
    if (price) query.andWhere("destination.price = :price ", { price: price });
  };
  static CATEGORY_FILTER = async function (
    category,
    query: SelectQueryBuilder<Destination>
  ) {
    if (category) {
      const foundedCategory = await Category.findOne({
        where: { name: category },
      });
      query
        .innerJoinAndSelect("category", "c2", "destination.categoryId=c2.id")
        .andWhere("destination.categoryId= :categoryId ", {
          categoryId: foundedCategory.id,
        });
    }
  };
}
