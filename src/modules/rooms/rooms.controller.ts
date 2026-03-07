import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.roomsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.remove(id);
  }
}
