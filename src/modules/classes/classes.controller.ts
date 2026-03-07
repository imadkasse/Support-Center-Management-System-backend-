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
  DefaultValuePipe,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('classes')
// @UseGuards(JwtAuthGuard, AdminGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.classesService.findAll(page, limit, isActiveFilter);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.remove(id);
  }
}
