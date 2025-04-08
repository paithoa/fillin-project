// Change this to your actual backend URL in production
import { Platform } from 'react-native';

// Automatically choose the correct URL based on platform
let baseUrl;
if (Platform.OS === 'ios') {
  baseUrl = 'http://localhost:5001'; // iOS simulator can use localhost
} else if (Platform.OS === 'android') {
  baseUrl = 'http://10.0.2.2:5001'; // Android emulator needs this special IP
} else {
  baseUrl = 'http://localhost:5001'; // Fallback
}

// You can override this manually if needed (e.g., for physical devices)
// For physical devices, use your computer's network IP, e.g., 'http://192.168.1.100:5001'
export const API_URL = baseUrl;

// Dummy data for posts if API fails
export const DUMMY_POSTS = [
  {
    _id: '1',
    title: 'Looking for 2 players',
    description: 'We need 2 more players for our weekend soccer game.',
    playersNeeded: 2,
    lookingToJoin: false,
    location: 'Central Park, NY',
    grade: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    phone: '123-456-7890',
    user: {
      _id: '101',
      name: 'John Doe',
    },
    createdAt: '2023-08-01T10:00:00Z',
  },
  {
    _id: '2',
    title: 'Looking to join a basketball team',
    description: 'Experienced player looking to join a local basketball team.',
    lookingToJoin: true,
    location: 'Brooklyn, NY',
    grade: 'Advanced',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1780&q=80',
    phone: '123-456-7891',
    user: {
      _id: '102',
      name: 'Jane Smith',
    },
    createdAt: '2023-08-02T11:00:00Z',
  },
  {
    _id: '3',
    title: 'Need 1 player for volleyball match',
    description: 'We need one more player for our volleyball team this Saturday.',
    playersNeeded: 1,
    lookingToJoin: false,
    location: 'Queens, NY',
    grade: 'Beginner',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1307&q=80',
    phone: '123-456-7892',
    user: {
      _id: '103',
      name: 'Mike Johnson',
    },
    createdAt: '2023-08-03T12:00:00Z',
  },
]; 