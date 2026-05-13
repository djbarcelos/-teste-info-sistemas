import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const error = this.mapError(exception);

        response.status(error.status).json({
            statusCode: error.status,
            error: error.code,
            message: error.message,
            details: exception.meta,
        });
    }

    private mapError(exception: Prisma.PrismaClientKnownRequestError) {
        switch (exception.code) {
            case 'P2002':
                return {
                    status: HttpStatus.CONFLICT,
                    code: 'UNIQUE_CONSTRAINT_VIOLATION',
                    message: 'Registro duplicado. Já existe um item com esse valor.',
                };

            case 'P2025':
                return {
                    status: HttpStatus.NOT_FOUND,
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Registro não encontrado.',
                };

            case 'P2003':
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code: 'FOREIGN_KEY_VIOLATION',
                    message: 'Relacionamento inválido.',
                };

            case 'P2014':
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code: 'RELATION_CONSTRAINT_ERROR',
                    message: 'Erro de relacionamento entre entidades.',
                };

            default:
                return {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    code: 'PRISMA_ERROR',
                    message: 'Erro interno no banco de dados.',
                };
        }
    }
}

@Catch(Prisma.PrismaClientUnknownRequestError)
export class PrismaUnknownExceptionFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientUnknownRequestError, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse<Response>();

        response.status(500).json({
            statusCode: 500,
            error: 'PRISMA_UNKNOWN_ERROR',
            message: 'Erro inesperado no banco de dados.',
        });
    }
}
