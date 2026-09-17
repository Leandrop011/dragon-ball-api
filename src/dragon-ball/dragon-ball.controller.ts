import { Controller, Get } from '@nestjs/common';
import { DragonBallService } from './dragon-ball.service';

@Controller('dragon-ball')
export class DragonBallController {
  constructor(
    private readonly dragonBallService: DragonBallService
  ) {}

  @Get('')
  getAllCharacters(){
    return {
      res: 'All Characters.'
    };
  }

}
