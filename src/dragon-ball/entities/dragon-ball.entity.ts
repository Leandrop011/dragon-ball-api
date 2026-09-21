import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class DragonBallCharacter extends Document{
    
    // * num of character
    @Prop({
        unique: true,
        index: true,
    })
    public numCharacter!: number;
    
    // * name of character
    @Prop({
        unique: true,
        index: true,
    })
    public name!: string;

    // * power of character
    @Prop({
        required: true,
    })
    public levelCharacter!: number;

    // TODO: PROXIMOS PASOS SE ENVIARAN IMAGENES A LA DB
    // public image: string

}

// ? create schema in db
export const DragonCharacterSchema = SchemaFactory.createForClass(DragonBallCharacter);
