import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
	
	const app = await NestFactory.create(AppModule);

	app.use(helmet({
		contentSecurityPolicy: false,
	}));

	app.use(rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 300,
		standardHeaders: true,
		legacyHeaders: false,
	}));

	const allowedOrigins = (process.env.FRONTEND_URLS || 'http://localhost:4200')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);

	app.enableCors({
		origin: allowedOrigins,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	});

	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	const config = new DocumentBuilder()
		.setTitle('SIGA API')
		.setDescription('API do sistema SIGA')
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);

	const port = process.env.PORT ? Number(process.env.PORT) : 3333;
	await app.listen(port);
	// eslint-disable-next-line no-console
	console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
