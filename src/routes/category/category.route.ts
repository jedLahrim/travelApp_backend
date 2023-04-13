import express from "express";
import { authGuard } from "../../jwt/jwt.strategy";
import { Category } from "../../entities/category.entity";
import { AppError } from "../../commons/errors/app-error";
import { ERR_NOT_FOUND_CATEGORY } from "../../commons/errors/errors-codes";

const router = express.Router();
router.get("/api/category/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOne({
    where: { id: id },
  });
  if (!category) {
    return res.status(404).json(new AppError(ERR_NOT_FOUND_CATEGORY));
  }
  res.json(category);
});
router.get("/api/categories", authGuard, async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});
export { router as categoryRoute };
