import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import * as authService from '../../../api/authService';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorMessage } from '../../../utils/errorUtils';

export default function LoginForm() {
  const [serverError, setServerError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const { accessToken } = await authService.login(data);
      login(accessToken);
      navigate('/topics');
    } catch (error) {
      setServerError(
        error?.response?.status === 401
          ? 'Invalid email or password.'
          : getErrorMessage(error)
      );
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Study Buddy
      </Typography>

      {serverError && (
        <Alert severity="error" role="alert">
          {serverError}
        </Alert>
      )}

      <TextField
        label="Email"
        type="email"
        fullWidth
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address',
          },
        })}
      />

      <TextField
        label="Password"
        type="password"
        fullWidth
        autoComplete="current-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 6, message: 'Password must be at least 6 characters' },
        })}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isSubmitting}
        sx={{ mt: 1 }}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
      </Button>

      <Typography variant="body2" align="center">
        New here?{' '}
        <Link component={RouterLink} to="/register">
          Click here to register
        </Link>
      </Typography>
    </Box>
  );
}