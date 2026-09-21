import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { isValidObjectId } from "mongoose";

// ! PIPE PERSONALIZADO QUE VERIFICARA QUE UN STRING SEA UN MONGOID 
@Injectable()
export class ParseMongoIdPipe implements PipeTransform{
    
    transform(value: string, metadata: ArgumentMetadata) {
        
        if (!isValidObjectId(value)) {
            throw new BadRequestException(`${value} is not a valid Mongo ID`);
        }
        
        return value;
    }

}
