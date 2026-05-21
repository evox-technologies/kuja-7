import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsUUID } from 'class-validator';
import { InterestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MatchesService } from './matches.service';
import type { Profile } from '@prisma/client';

class RespondInterestDto {
  @IsEnum(InterestStatus)
  status!: InterestStatus;
}

class SendInterestDto {
  @IsUUID()
  receiverId!: string;
}

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post('interests')
  sendInterest(@Body() dto: SendInterestDto, @CurrentUser() user: Profile) {
    return this.matchesService.sendInterest(user.id, dto.receiverId);
  }

  @Get('interests/received')
  getReceived(@CurrentUser() user: Profile) {
    return this.matchesService.getReceivedInterests(user.id);
  }

  @Patch('interests/:id')
  respond(
    @Param('id') id: string,
    @Body() dto: RespondInterestDto,
    @CurrentUser() user: Profile,
  ) {
    return this.matchesService.respondToInterest(id, user.id, dto.status);
  }

  @Post('shortlist/:targetId')
  toggleShortlist(
    @Param('targetId') targetId: string,
    @CurrentUser() user: Profile,
  ) {
    return this.matchesService.toggleShortlist(user.id, targetId);
  }

  @Get('shortlist')
  getShortlist(@CurrentUser() user: Profile) {
    return this.matchesService.getShortlist(user.id);
  }
}
