import { CurrentUser } from './user';
import { Request } from 'express';

interface RequestWithUser extends Request {
    user: CurrentUser
}

export { RequestWithUser };