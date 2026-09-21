import { PartialType } from "@nestjs/mapped-types";
import { CreateCharacterDTO } from "./create-character.dto";

// ? usamos partialtype para tener las mismas properties del create con mismas 
// ? reglas exceptuando una, todas son opcionales
export class UpdateCharacterDTO extends PartialType(CreateCharacterDTO){}
