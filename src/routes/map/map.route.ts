import express from "express";
import { GoogleMap } from "../../geo/google-map";
import { body } from "express-validator";
import { ValidationErrors } from "../../validation/validation.errors";

const router = express.Router();
router.get(
  "/api/location/address",
    body("address").isString().withMessage("address must be string"),
    ValidationErrors,
  async (req, res) => {
    const { address } = req.body;
    const data = await GoogleMap.GET_LOCATION(address);
    res.json({ data: data });
  }
);
export { router as mapRoute };
