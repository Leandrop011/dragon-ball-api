import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DragonBallService } from './dragon-ball.service';
import { CreateCharacterDTO } from './dto/create-character.dto';
import { UpdateCharacterDTO } from './dto/update-character.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { PaginationDTO } from '../common/dto/pagination.dto';

@Controller('dragon-ball')
export class DragonBallController {
  constructor(
    private readonly dragonBallService: DragonBallService
  ) {}

  // ! ENDPOIND GET AUE OBTIENE UNA LIST DE CHARACTERS CON QUERY PARAMETERS
  @Get('')
  getAllCharacters(
    @Query() paginationDTO: PaginationDTO
  ){
    return this.dragonBallService.getAllCharacters(paginationDTO);
  }

  // ! ENDPOIND GET QUE OBTIENE UN CHARACTER BY A TERM
  @Get(':term')
  getCharacterByTerm(
    @Param('term') 
    term: string,
  ){
    return this.dragonBallService.getCharacterByTerm( term );
  }

  // ! ENDPOINT POST QUE CREA UN NUEVO CHARACTER EN LA DB, SEGUN LO QUE MANDE EL USER
  @Post('')
  createCharacter(
    @Body() createCharacterDTO: CreateCharacterDTO
  ){
    return this.dragonBallService.createCharacter( createCharacterDTO );
  }

  // ! ENDPOINT PATCH QUE ACTUALIZA LAS PROPERTIES DE UN CHARACTER SEGUN UN TERM
  @Patch(':term')
  updatedCharacterByTerm(
    @Param('term') term: string,
    @Body() updateCharacterDTO: UpdateCharacterDTO,
  ){
    return this.dragonBallService.updateCharacter( term, updateCharacterDTO );
  }

  // ! NEDPOINT DELETE QUE ELIMINA UN CHARACTER DE LA DB SEGUN UN MONGO ID ( ANTES DE REALIZAR LA 
  // ! OPERACION ES VERIFICADO EL STRING POR UN PIPE PERSONALIZADO )
  @Delete(':id')
  deleteCharacterById(
    @Param('id', ParseMongoIdPipe) id: string
  ){
    return this.dragonBallService.deleteCharacterById( id );
  }

}
