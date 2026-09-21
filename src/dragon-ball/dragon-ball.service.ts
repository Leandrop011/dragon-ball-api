import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DragonBallCharacter } from './entities/dragon-ball.entity';
import { isValidObjectId, Model } from 'mongoose';
import { CreateCharacterDTO } from './dto/create-character.dto';
import { UpdateCharacterDTO } from './dto/update-character.dto';
import { PaginationDTO } from '../common/dto/pagination.dto';

@Injectable()
export class DragonBallService {
    
    constructor(
        // ? model of character dragon ball
        @InjectModel(DragonBallCharacter.name)
        private readonly characterModel: Model<DragonBallCharacter>,
    ){}

    // * METODO QUE DEVOLVERA POR LO MENOS 5 CHARACTER Y SIN OFFSET 
    // * ( SI EL USER NO ESPECIFICA LOS QUERY PARAMETERS )
    async getAllCharacters(paginationDTO: PaginationDTO) {
      return await this.characterModel.find()
      .limit(paginationDTO.limit ?? 5) // * add a limit of num items
      .skip(paginationDTO.offset ?? 0) // * add a offset in the list
      .sort({ // * colocar en modo ascendente la list
        numCharacter: 1
      })
      .select('-__v') // * eliminar de la response de la column '__v'
    }
    
    // * METODO QUE BUSCARA EN LA DB UN CHARACTER SEGUN UN TERM(NAME, NUM, MONGOID)
    async getCharacterByTerm( term: string ){
        // ? definir variable que se llemara de una instancia de la db o no
        let character: DragonBallCharacter | null = null
        
        // ? busqueda por num
        if (!isNaN(+term)) {
            character = await this.characterModel.findOne({numCharacter: +term})
        }
        
        // ? busqueda por mongoId
        if (!character && isValidObjectId(term)) {
            character = await this.characterModel.findById(term);
        }
        
        // ? busqueda final por name
        if (!character) {
            character = await this.characterModel.findOne({name: term});
        }
        
        // ? devolver un error si no se encuentra el character
        if (!character) {
            throw new NotFoundException(`Character with id, name or num not found, term: ${term}`);
        }
        
        // ? devolver el character encontrado
        return character;
    }
    
    // * METODO QUE CREARA UN CHARACTER EN LA DB
    async createCharacter(createCharacterDTO: CreateCharacterDTO) {
        // ? let que se llenara posteriormente
        let newCharacter: DragonBallCharacter | null = null
        
        // ? colocamos todos los names en lowerCase
        createCharacterDTO.name = createCharacterDTO.name.toLocaleLowerCase().trim();
        
        try {
            // ? creamos el nuevo character en la db
            newCharacter = await this.characterModel.create(createCharacterDTO);
            // ? retornamos
            return newCharacter;
        } catch (error: any) {
            this.handleExceptions(error);
        }
    }
    
    // * METODO QUE ACTUALIZARA UN CHARACTER DE LA DB SEGUN UN TERM
    async updateCharacter(
        term: string, 
        updateCharacterDTO: UpdateCharacterDTO
    ) {
        // ? primero buscamos el character
        const character = await this.getCharacterByTerm(term);
        
        // ? si en el dto viene el name, lo colocamos en lowercase
        if (updateCharacterDTO.name)
            updateCharacterDTO.name = updateCharacterDTO.name.toLocaleLowerCase().trim();
        
        try {
            // ? actualizamos en la db con lo que viene en el dto,
            // ? actualizamos segun el registro encontrado con el get
            await character.updateOne(updateCharacterDTO, {new: true});
            // ? para mostrarle al user que si se actualizo como es debido
            // ? se riegan primero las properties de el character encontrado y luego 
            // ? las propiedades del dto para update
            return {...character.toJSON(), ...updateCharacterDTO}
        } catch (error: any) {
            // ? error posible
            this.handleExceptions(error);
        }
    }
    

    // * METODO QUE ELIMINA UN CHARACTER SEGUN UN MONGO ID
    async deleteCharacterById(id: string) {
      try {
        // ? con el model realizamos la eliminacion en 1 sola instruccion
        // ? busca en la colum _id si se encuentra un registro con ese id
        // ? si lo encuentra lo elimina y solo con 1 instruccion en lugar 
        // ? de primero buscar y luego eliminar en base a ese registro
        // ? desestructuramos la propiedad deletedCount
        const { deletedCount } = await this.characterModel.deleteOne({_id: id});

        // ? si es 0 significa que no elimino ninguno (no existe, error)
        if (deletedCount === 0) throw new BadRequestException(`Character with id: '${id}' not found.`);

        // ? pero si es >0, si elimino deolvemos un msj
        return {
            status: 'OK'
        }
      } catch (error: any) {
        // ? posible error
        this.handleExceptions(error);
      }
    }
    
    // * METODO QUE MANEJA TIPOS DE ERRORES QUE PUEDE SUCEDER, PERO SIEMPRE MANDA UN ERROR
    handleExceptions( error: any ){
        if (error.code === 11000) {
            throw new BadRequestException(`Character exist in db ${JSON.stringify(error.keyValue)}`);
        }
        throw new BadRequestException('Error, check your logs for more information.')
    }
}
