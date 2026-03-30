// middleware/validate.js — Joi request validation + generic validate() middleware

const Joi = require("joi");

// ── Reusable field rules ─────────────────────────────────
const password = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[A-Z]/, "uppercase")
  .pattern(/[a-z]/, "lowercase")
  .pattern(/[0-9]/, "number")
  .messages({
    "string.pattern.name": "Password must contain at least one {#name} letter/digit.",
  });

// ── Schemas ──────────────────────────────────────────────
const schemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email:    Joi.string().email().required(),
    password: password.required(),
    role:     Joi.string().valid("admin", "voter", "observer"),
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  updateWallet: Joi.object({
    walletAddress: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required()
      .messages({ "string.pattern.base": "Invalid Ethereum address." }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword:     password.required(),
  }),

  updateUser: Joi.object({
    email:    Joi.string().email(),
    username: Joi.string().alphanum().min(3).max(30),
    role:     Joi.string().valid("admin", "voter", "observer"),
    isActive: Joi.boolean(),
  }).min(1),
};

/**
 * validate(schemaName) — express middleware that validates req.body
 * against the named schema and returns 422 on failure.
 */
const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next(new Error(`Unknown validation schema: ${schemaName}`));

  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const messages = error.details.map((d) => d.message).join("; ");
    return res.status(422).json({ message: messages });
  }

  req.body = value;   // replace with sanitised value
  next();
};

module.exports = { validate, schemas };