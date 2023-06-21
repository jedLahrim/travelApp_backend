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
  static OUTPUT_TYPE = "audio_url";
  static resetString = Constant.ResetCodeString(7);
  static TAKE = 40;
  static SKIP = 0;
  static DATE_PATTERN =
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

  static TEXT_TO_SPEECH_OPTION_FIRST_PROVIDER = function (
    encodedParams: URLSearchParams
  ) {
    return {
      method: "POST",
      url: "https://cloudlabs-text-to-speech.p.rapidapi.com/synthesize",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-RapidAPI-Key": "4fb84e5862msh93493191641aa67p1730ebjsn9a38755eabe6",
        "X-RapidAPI-Host": "cloudlabs-text-to-speech.p.rapidapi.com",
      },
      data: encodedParams,
    };
  };
  static TEXT_TO_SPEECH_OPTION_SECOND_PROVIDER = function (
    language: string,
    text: string,
  ) {
    const encodedParams = new URLSearchParams();
    encodedParams.set('text', text);
    encodedParams.set('language_code', 'en-US');
    encodedParams.set('gender', 'male');
    return {
      method: 'POST',
      url: 'https://text-to-speech7.p.rapidapi.com/voice',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': '4fb84e5862msh93493191641aa67p1730ebjsn9a38755eabe6',
        'X-RapidAPI-Host': 'text-to-speech7.p.rapidapi.com'
      },
      data: encodedParams,
    };
  };
  static CONTENT_TYPE = "application/x-www-form-urlencoded";
  static RAPID_API_KEY = "4fb84e5862msh93493191641aa67p1730ebjsn9a38755eabe6";
  static RAPID_API_HOST = "google-translate105.p.rapidapi.com";
  static TRANSLATION_HEADERS = {
    "content-type": Constant.CONTENT_TYPE,
    "X-RapidAPI-Key": Constant.RAPID_API_KEY,
    "X-RapidAPI-Host": Constant.RAPID_API_HOST,
  };
}

export class Filter {
  static TITLE_FILTER = function (
    title,
    query: SelectQueryBuilder<Destination>
  ) {
    if (title) query.andWhere("destination.title = :title ", { title: title });
  };
  static PRICE_FILTER = function (
    maxPrice,
    minPrice,
    query: SelectQueryBuilder<Destination>
  ) {
    if (maxPrice)
      query.andWhere("destination.price < :maxPrice ", { maxPrice: maxPrice });

    if (minPrice)
      query.andWhere("destination.price > :minPrice ", { minPrice: minPrice });
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
          categoryId: foundedCategory ? foundedCategory.id : null,
        });
    }
  };
}
