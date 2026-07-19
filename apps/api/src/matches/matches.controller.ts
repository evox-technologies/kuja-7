import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsUUID, IsIn } from 'class-validator';
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

class RespondContactRequestDto {
  @IsIn(['ACCEPT', 'DECLINE'])
  action!: 'ACCEPT' | 'DECLINE';
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

  @Get('interests/sent')
  getSent(@CurrentUser() user: Profile) {
    return this.matchesService.getSentInterests(user.id);
  }

  @Delete('interests/:receiverId')
  removeInterest(
    @Param('receiverId') receiverId: string,
    @CurrentUser() user: Profile,
  ) {
    return this.matchesService.removeInterest(user.id, receiverId);
  }

  @Patch('interests/:id')
  respond(
    @Param('id') id: string,
    @Body() dto: RespondInterestDto,
    @CurrentUser() user: Profile,
  ) {
    return this.matchesService.respondToInterest(id, user.id, dto.status);
  }

  @Get('mutual')
  getMutual(@CurrentUser() user: Profile) {
    return this.matchesService.getMutualInterests(user.id);
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

  @Post('contact-request/:targetId')
  sendContactRequest(
    @Param('targetId') targetId: string,
    @CurrentUser() user: Profile,
  ) {
    return this.matchesService.sendContactRequest(user.id, targetId);
  }

  @Patch('contact-request/:requesterId')
  respondContactRequest(
    @Param('requesterId') requesterId: string,
    @Body() dto: RespondContactRequestDto,
    @CurrentUser() user: Profile,
  ) {
    return this.matchesService.respondContactRequest(
      requesterId,
      user.id,
      dto.action,
    );
  }

  @Get('contact-request/status/:targetId')
  getContactRequestStatus(
    @Param('targetId') targetId: string,
    @CurrentUser() user: Profile,
  ) {
    return this.matchesService.getContactRequestStatus(user.id, targetId);
  }
}
