// Change this to your actual backend URL in production
import { Platform } from 'react-native';

// Automatically choose the correct URL based on platform and environment
let baseUrl;
if (__DEV__) {
  // Development environment
  if (Platform.OS === 'ios') {
    baseUrl = 'http://localhost:5001'; // iOS simulator can use localhost
  } else if (Platform.OS === 'android') {
    baseUrl = 'http://10.0.2.2:5001'; // Android emulator needs this special IP
  } else {
    baseUrl = 'http://localhost:5001'; // Fallback
  }
} else {
  // Production environment
  baseUrl = 'https://sconnect-api-469-55a2ba13b4c8.herokuapp.com';
}

// Export the API URL
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

// Default sport types for selection
export const SPORT_TYPES = [
  'Basketball',
  'Soccer',
  'Football',
  'Baseball',
  'Tennis',
  'Volleyball',
  'Golf',
  'Swimming',
  'Running',
  'Cycling',
  'Hiking',
  'Hockey',
  'Rugby',
  'Cricket',
  'Badminton',
  'Other'
];

// Sample locations for demo purposes
export const SAMPLE_LOCATIONS = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Jose, CA'
];

// Placeholder posts for development/demo
export const PLACEHOLDER_POSTS = [
  {
    _id: 'post1',
    title: 'Looking for basketball players',
    description: 'We need 2 players for our recreational basketball team. Games are on Saturdays at 2pm.',
    sportType: 'Basketball',
    location: 'Central Park, NY',
    date: new Date('2023-08-20'),
    user: {
      _id: 'user1',
      name: 'John Smith',
      email: 'john@example.com',
      profileImage: 'https://randomuser.me/api/portraits/men/32.jpg'
    }
  },
  {
    _id: 'post2',
    title: 'Soccer team seeking goalkeeper',
    description: 'Our soccer team needs a reliable goalkeeper for the upcoming season. Practice twice a week, games on Sundays.',
    sportType: 'Soccer',
    location: 'Prospect Park, Brooklyn',
    date: new Date('2023-08-25'),
    user: {
      _id: 'user2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      profileImage: 'https://randomuser.me/api/portraits/women/44.jpg'
    }
  },
  {
    _id: 'post3',
    title: 'Tennis partner wanted',
    description: 'Looking for an intermediate level tennis partner for weekly games. I have access to courts at my apartment complex.',
    sportType: 'Tennis',
    location: 'Midtown, NY',
    date: new Date('2023-08-15'),
    user: {
      _id: 'user3',
      name: 'Mike Wilson',
      email: 'mike@example.com',
      profileImage: 'https://randomuser.me/api/portraits/men/45.jpg'
    }
  },
  {
    _id: 'post4',
    title: 'Volleyball team forming',
    description: 'Starting a new co-ed volleyball team for beginners. No experience necessary, just looking for people who want to have fun and get some exercise.',
    sportType: 'Volleyball',
    location: 'Jones Beach, Long Island',
    date: new Date('2023-09-01'),
    user: {
      _id: 'user4',
      name: 'Lisa Chen',
      email: 'lisa@example.com',
      profileImage: 'https://randomuser.me/api/portraits/women/67.jpg'
    }
  },
  {
    _id: 'post5',
    title: 'Morning running group',
    description: 'Join our morning running group! We meet at 6am on Tuesdays and Thursdays for a 5K run. All paces welcome.',
    sportType: 'Running',
    location: 'Hudson River Park',
    date: new Date('2023-08-17'),
    user: {
      _id: 'user5',
      name: 'David Brown',
      email: 'david@example.com',
      profileImage: 'https://randomuser.me/api/portraits/men/22.jpg'
    }
  }
]; 