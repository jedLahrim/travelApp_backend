import { body, query, check } from "express-validator";
import { checkValidationErrors } from "../../validation/validation.errors";
import express from "express";
import { Destination } from "../../entities/destination.entity";
import { authGuard } from "../../jwt/jwt.strategy";
import { Pagination } from "../../commons/pagination";
import { Constant, Filter } from "../../commons/constant";
import { AppError } from "../../commons/errors/app-error";
import { Response, Request } from "express";
import {
  ERR_NOT_FOUND_ATTACHMENTS,
  ERR_NOT_FOUND_DESTINATIONS,
  ERR_NOT_FOUND_USER,
  ERR_PRIMARY_ATTACHMENTS_NOT_FOUND,
  ERROR_MAX_PARTICIPANTS_GRATER_REQUIRED,
  ERROR_START_DATE_GRATER_END_DATE,
} from "../../commons/errors/errors-codes";
import { GetUser } from "../../decorator/get-user.decorator";
import { CategoryType } from "../../commons/enums/category-type";
import { Category } from "../../entities/category.entity";
import { Attachment } from "../../entities/attachment.entity";
import { In } from "typeorm";
const router = express.Router();
router.post(
    "/api/destination/create",
    body("title").isString().withMessage("name must be string"),
    body("price").isInt().withMessage("price must be number"),
    body("requiredNumberTravelers")
        .isInt()
        .withMessage("requiredNumberTravelers must be number"),
    body("endDate")
        .matches(Constant.DATE_PATTERN)
        .withMessage("endDate must be in correct format yyyy:mm:dd hh:mm:ss"),
    body("startDate")
        .matches(Constant.DATE_PATTERN)
        .withMessage("startDate must be in correct format yyyy:mm:dd hh:mm:ss"),
    body("long").isDecimal().withMessage("long must be a valid longitude"),
    body("lat").isDecimal().withMessage("lat must be a latitude"),
    body("category").custom((category, {req}) => {
        if (!Object.values(CategoryType).includes(category.name)) {
            throw new Error("put a valid category type");
        }
        return true;
    }),
    checkValidationErrors,
    authGuard,
    async (req, res) => {
        const user = await GetUser(req);
        if (!user) {
            res.json(new AppError(ERR_NOT_FOUND_USER));
        } else {
            const {
                title,
                price,
                description,
                startDate,
                endDate,
                requiredNumberTravelers,
                long,
                lat,
                category,
                primaryAttachment,
                maxTravelers,
                attachments,
            } = req.body;
            if (
                _checkFields(
                    startDate,
                    endDate,
                    maxTravelers,
                    requiredNumberTravelers,
                    res
                )
            ) {
            } else {
                const foundedCategory = Category.create({name: category.name});
        await Category.save(foundedCategory);
        let destination = Destination.create({
            lat: lat,
            long: long,
            title,
            price: price,
            description,
            startDate,
            endDate,
            requiredNumberTravelers,
            category: foundedCategory,
            maxTravelers,
            user: {id: user.id},
        });
        if (attachments) {
          await _saveAttachment(
            destination,
            attachments,
            primaryAttachment,
            res
          );
        } else {
          res.json(await Destination.save(destination));
        }
      }
    }
  }
);
function _checkFields(
  startDate: Date,
  endDate: Date,
  maxTravelers: number,
  requiredNumberTravelers: number,
  res: Response
) {
  if (startDate > endDate) {
    return res.json(new AppError(ERROR_START_DATE_GRATER_END_DATE));
  }
  if (maxTravelers < requiredNumberTravelers) {
    return res.json(new AppError(ERROR_MAX_PARTICIPANTS_GRATER_REQUIRED));
  }
}
async function _saveAttachment(
  destination,
  attachments,
  primaryAttachment,
  res
) {
  if (!(await _checkAttachmentsExist(attachments))) {
    res.status(404).json(new AppError(ERR_NOT_FOUND_ATTACHMENTS));
  } else {
    let foundedAttachment = _checkPrimaryInAttachments(
      attachments,
      primaryAttachment
    );
    if (!foundedAttachment) {
      return res
        .status(404)
        .json(new AppError(ERR_PRIMARY_ATTACHMENTS_NOT_FOUND));
    } else {
      destination.attachments = attachments;
      destination.image_url = foundedAttachment.url;
      destination.primaryAttachment = foundedAttachment.id;
      res.json(await Destination.save(destination));
    }
  }
}
router.get(
    "/api/destinations",
    query("title")
        .optional({nullable: true})
        .isString()
        .withMessage("title must be string"),
    query("price")
        .optional({nullable: true})
        .isInt()
        .withMessage("price must be number"),
    query("take")
        .optional({nullable: true})
        .isInt()
        .withMessage("take must be number"),
    query("skip")
        .optional({nullable: true})
        .isInt()
        .withMessage("skip must be number"),
    check("category")
        .optional({nullable: true})
        .isIn(Object.values(CategoryType))
        .withMessage("Invalid category type"),
    checkValidationErrors,
    authGuard,
    async (req, res) => {
        const {title, price, take, skip, category} = req.query;
        const query = Destination.createQueryBuilder("destination");
        await Filter.CATEGORY_FILTER(category, query);
        Filter.TITLE_FILTER(title, query);
        Filter.PRICE_FILTER(price, query);
        query.take(+take ? +take : Constant.TAKE);
        query.skip(+skip ? +skip : Constant.SKIP);
        const [data, total] = await query.getManyAndCount();
        const destinations = new Pagination<Destination>(data, total);
        res.json(destinations);
    }
);
router.get("/api/destination/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  const destination = await _findOne(id, res);
  res.json(destination);
});
router.patch(
    "/api/destination/update/:id",
    authGuard,
    body("title").isString().withMessage("name must be string"),
    body("price").isInt().withMessage("price must be number"),
    body("requiredNumberTravelers")
        .isInt()
        .withMessage("requiredNumberTravelers must be number"),
    body("endDate")
        .matches(Constant.DATE_PATTERN)
        .withMessage("endDate must be in correct format yyyy:mm:dd hh:mm:ss"),
    body("startDate")
        .matches(Constant.DATE_PATTERN)
        .withMessage("startDate must be in correct format yyyy:mm:dd hh:mm:ss"),
    body("description").isString().withMessage("description must be string"),
    body("long").isDecimal().withMessage("long must be a valid longitude"),
    body("lat").isDecimal().withMessage("lat must be a latitude"),
    body("category").custom((category, {req}) => {
        if (!Object.values(CategoryType).includes(category.name)) {
            throw new Error("put a valid category type");
        }
        return true;
    }),
    checkValidationErrors,
    async (req, res) => {
        const {id} = req.params;
        const user = await GetUser(req);
        const {
            title,
            price,
            description,
            long,
            lat,
            category,
            primaryAttachment,
            attachments,
            startDate,
            endDate,
            requiredNumberTravelers,
            joinedNumberParticipants,
            maxTravelers,
        } = req.body;
        if (
            _checkFields(
                startDate,
                endDate,
                maxTravelers,
                requiredNumberTravelers,
                res
            )
        ) {
        } else {
            const foundedCategory = await Category.findOne({
                where: {name: category.name},
      });
      const updateResult = await Destination.update(
        { id },
        {
          lat: lat,
          long: long,
          title,
          price,
          description,
          startDate,
          endDate,
          requiredNumberTravelers,
          joinedNumberParticipants,
          category: foundedCategory,
          maxTravelers,
          user: { id: user.id },
        }
      );
      if (updateResult.affected == null || updateResult.affected == 0) {
        return res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));
      }
      const destination = await _findOne(id, res);
      if (attachments) {
        await _saveAttachment(destination, attachments, primaryAttachment, res);
      } else res.json(destination);
    }
  }
);
router.delete(
  "/api/destination/delete/:id",
  authGuard,
  async (req: Request, res) => {
    let { id } = req.params;
    const result = await Destination.delete({ id });
    if (result.affected === 0) {
      return res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));
    }
    console.log(result);
    res.json();
  }
);

export { router as destinationRoute };
export async function _findOne(id, res: Response): Promise<Destination> {
  const destination = await Destination.findOne({
    where: { id: id },
    relations: { category: true },
  });
  if (!destination) {
    res.status(404).json(new AppError(ERR_NOT_FOUND_DESTINATIONS));
  } else return destination;
}
async function _checkAttachmentsExist(attachments: Attachment[]) {
  const ids = attachments.map((attachment) => attachment.id);
  const foundedAttachments = await Attachment.findBy({
    id: In(ids),
  });
  return attachments.length == foundedAttachments.length;
}
function _checkPrimaryInAttachments(
  attachments: Attachment[],
  primaryAttachment: string
): Attachment {
  let foundedPrimaryAttachment = attachments.find(
    (value) => value.id == primaryAttachment
  );
  if (!foundedPrimaryAttachment) {
    return;
  } else return foundedPrimaryAttachment;
}
