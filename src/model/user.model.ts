export class RegisterUserRequest {
  username: string;
  password: string;
  name: string;
}

export class LoginUserRequest {
  username: string;
  password: string;
}

export class UserResponse {
  username: string;
  name: string;
  id: string;
  token?: string;
}

export class UpdateUserRequest {
  password?: string;
  name?: string;
}
