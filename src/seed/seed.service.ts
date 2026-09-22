import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DragonBallCharacter } from '../dragon-ball/entities/dragon-ball.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from '../common/adapter/axios.adapter';
import { DragonBallResponse } from './interfaces/dragonball-response.interface';
import { CharacterToDBInterface } from './interfaces/character-to-db.interface';

@Injectable()
export class SeedService {

  constructor(
    // * injeccion del model de nuestra entidad (para realizar operaciones en la DB)
    @InjectModel(DragonBallCharacter.name)
    private readonly dragonBallModel: Model<DragonBallCharacter>,
    private readonly http: AxiosAdapter,
  ){}
  
  // * METODO QUE LLENARA DE DATA LA BD PARA QUE LOS USUARIOS PUEDAN PROVAR LOS ENDPOINTS
  async executeSeed() {

    // ? hacer una eliminacion previa de toda la data para reestablecer
    await this.dragonBallModel.deleteMany({});

    // ? realizar una peticion http get a un servicio externo
    // ? agregamos tipado con la interface DragonBallResponse
    const resToRequest = await this.http.get<DragonBallResponse>('https://dragonball-api.com/api/characters?limit=70')

    // ? crear un array de la interface CharacterToDBInterface
    // ? lo realizamos para insetar varios registros en una solo query 
    let charactersToInsert: CharacterToDBInterface[] = [];

    // ? en base a los items de la response, separamos cada item
    // ? desestructuramos name, id y el ki
    resToRequest.items.map(({name, id, ki}) => {
      const max = 100000;
      const min = 10000;
      // ? si la conversion de el ki a number no funciona pues se busca un numero randomico
      // ? sino el mismo que viene 
      let levelCharacterRandom: number = min;
      if (isNaN(+ki)) {
        levelCharacterRandom = Number((Math.random() * (max - min + 1) + min).toFixed(0));
      }else{
        levelCharacterRandom = +ki;
      }

      // ? transformar all names in lowercase before to insert
      name = name.toLocaleLowerCase();
      
      // ? agregamos la info de cada item al array como nuevo item
      charactersToInsert.push({
        numCharacter: id, 
        name: name, 
        levelCharacter: levelCharacterRandom
      });
    });

    // ? utilizamos el insertmany y le mandamos el array de characteres
    // ? y esto es mas optimo que ejecutar multiples querys insertando uno por uno 
    await this.dragonBallModel.insertMany(charactersToInsert);

    return `SEED EXECUTED`;

  }


}
