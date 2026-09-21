import { IsNotEmpty, IsNumber, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreateCharacterDTO {

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @Min(1)
    public numCharacter!: number; // * num of character
    
    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    public name!: string; // * name of character
    
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @Min(1)
    public levelCharacter!: number; // * level of character
}
