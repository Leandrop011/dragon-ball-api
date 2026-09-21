
import * as Joi from "joi";

// ! VALIDATIONSCHEMA QUE LO QUE HACE ES QUE AGREGA REGLAS A LAS ENVS

export const JoiValidationSchema = Joi.object({
    MONGODB: [ Joi.required(), ],
    PORT: Joi.number().default(3000),
})