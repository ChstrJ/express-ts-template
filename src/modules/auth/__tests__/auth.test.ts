import { authService } from '../auth.service';
import { authRepository } from '../auth.repository';
import { comparePassword } from '@lib/hash';
import { signAccessToken, signRefreshToken } from '@lib/jwt';
import { UnauthorizedException } from '@utils/errors';

// Mock dependencies
jest.mock('../auth.repository');
jest.mock('@lib/hash');
jest.mock('@lib/jwt');

describe('Auth Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should return access and refresh tokens on successful login', async () => {
    const mockUser = { id: '123', email: 'test@example.com', account_password: 'hashedPassword' };
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (comparePassword as jest.Mock).mockResolvedValue(true);
    (signAccessToken as jest.Mock).mockReturnValue('mockAccessToken');
    (signRefreshToken as jest.Mock).mockReturnValue('mockRefreshToken');

    const req: any = { body: { email: 'test@example.com', password: 'password123' } };
    const result = await authService.login(req);

    expect(authRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(signAccessToken).toHaveBeenCalledWith(mockUser);
    expect(signRefreshToken).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({ accessToken: 'mockAccessToken', refreshToken: 'mockRefreshToken' });
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue({ account_password: 'hashedPassword' });
    (comparePassword as jest.Mock).mockResolvedValue(false);

    const req: any = { body: { email: 'test@example.com', password: 'wrongPassword' } };

    await expect(authService.login(req)).rejects.toThrow(UnauthorizedException);
    await expect(authService.login(req)).rejects.toThrow('Invalid credentials.');
  });
});