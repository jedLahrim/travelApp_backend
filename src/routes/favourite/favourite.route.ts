import { checkValidationErrors } from "../../validation/validation.errors";
import express, { Request, Response } from "express";
import { Destination } from "../../entities/destination.entity";
import { Favourite } from "../../entities/favourite.entity";
import { authGuard } from "../../jwt/jwt.strategy";
import { ERR_NOT_FOUND_DESTINATIONS } from "../../commons/errors/errors-codes";
import { AppError } from "../../commons/errors/app-error";
import { GetUser } from "../../decorator/get-user.decorator";
import { appDataSource } from "../../app";

const router = express.Router();
router.post(
  "/api/favourite/create",
  checkValidationErrors,
  authGuard,
  async (req: Request, res: Response) => {
    const body = req.body;
    const user = await GetUser(req);
    const destination = await _checkDestinationExist(body.destinationId);
    if (!destination) {
      res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));
    } else {
      if (!destination.favourite) {
        const favourite = Favourite.create({
          destination: destination,
          user: user,
        });
        await Favourite.save(favourite);
        res.json(favourite);
      } else {
        res.json(await Favourite.save(destination.favourite));
      }
    }
  }
);

router.get("/api/favourites", authGuard, async (req: Request, res) => {
  const user = await GetUser(req);
  const favourites = await Favourite.find({ where: { user: { id: user.id } } });
  res.json(favourites);
});

router.get("/api/favourite/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  const favourite = await Favourite.findOne({
    where: { id: id },
  });
  res.json(favourite);
});

router.delete(
  "/api/favourite/delete/:id",
  authGuard,
  async (req: Request, res) => {
    const repo = appDataSource.getRepository(Favourite);
    let { id } = req.params;
    const result = await repo.softDelete(id);
    console.log(result);
    if (result.affected === 0) {
      res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));
    }
    res.json();
  }
);
export { router as favouriteRoute };

async function _checkDestinationExist(
  destinationId: string
): Promise<Destination> {
  return await Destination.findOne({
    where: { id: destinationId },
    relations: { favourite: true },
  });
}
