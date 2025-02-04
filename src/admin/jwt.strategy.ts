// jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
 constructor(private configService: ConfigService) {
   const jwtSecret = configService.get<string>('JWT_SECRET');
   if (!jwtSecret) {
     throw new Error('JWT_SECRET is not configured');
   }

   super({
     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
     ignoreExpiration: false,
     secretOrKey: jwtSecret,
     passReqToCallback: true
   });
 }

 async validate(req: Request, payload: any) {
   if (!payload.sub || !payload.username || !payload.iat) {
     throw new UnauthorizedException('Invalid token payload');
   }

   // Check token age
   const tokenAge = Date.now() - payload.iat * 1000;
   if (tokenAge > 24 * 60 * 60 * 1000) { // 24 hours
     throw new UnauthorizedException('Token expired');
   }

   return { userId: payload.sub, username: payload.username };
 }
}