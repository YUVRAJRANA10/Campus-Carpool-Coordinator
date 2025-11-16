# Contributing to Campus Carpool Coordinator

Thank you for your interest in contributing to the Campus Carpool Coordinator! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Campus-Carpool-Coordinator.git
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style
- Use **React functional components** with hooks
- Follow **ES6+ syntax** and modern JavaScript patterns
- Use **Tailwind CSS** for styling
- Implement **React Query** for data fetching
- Use **TypeScript** where applicable

### Performance Standards
- All components should be **memoized** with React.memo where appropriate
- Use **useMemo** and **useCallback** for expensive operations
- Implement **proper cleanup** in useEffect hooks
- Follow the **enterprise performance patterns** established in the codebase

### Feature Development

#### For New Features:
1. Create a **feature branch**: `git checkout -b feature/your-feature-name`
2. **Test thoroughly** with the existing real-time system
3. **Update documentation** if needed
4. **Add tests** for new functionality
5. **Submit a pull request** with detailed description

#### For Bug Fixes:
1. Create a **bugfix branch**: `git checkout -b bugfix/issue-description`
2. **Identify the root cause** using the performance monitoring
3. **Fix and test** thoroughly
4. **Submit a pull request** with issue reference

## Project Architecture

### Key Components:
- `MobileBookingFlow.jsx` - Uber-like booking experience
- `DriverDashboard.jsx` - Real-time driver interface
- `RealTimeRideContext.jsx` - Live ride management
- `PerformanceContext.jsx` - Enterprise performance optimization

### State Management:
- **React Query** for server state caching
- **Context API** with memoization for global state
- **Local state** for component-specific data

## Testing Guidelines

### Manual Testing:
1. **Mobile booking flow** - Test all 4 steps
2. **Real-time updates** - Test with multiple browser windows
3. **Driver notifications** - Test accept/decline functionality
4. **Performance** - Check loading states and animations

### Browser Testing:
- **Chrome, Firefox, Safari, Edge**
- **Mobile devices** and responsive design
- **Different screen sizes** and orientations

## Submission Guidelines

### Pull Request Requirements:
- **Clear title** and description
- **Reference related issues** if applicable
- **Screenshots/GIFs** for UI changes
- **Performance impact** assessment
- **Mobile testing** confirmation

### Code Review Process:
1. **Automated checks** must pass
2. **Manual review** by maintainers
3. **Performance validation**
4. **Mobile compatibility** check
5. **Merge approval**

## Real-Time Features

When working with real-time features:
- Test **WebSocket connections** thoroughly
- Ensure **proper cleanup** on component unmount
- Handle **connection failures** gracefully
- Test **concurrent users** scenario

## Supabase Integration

For database-related changes:
- Follow **row-level security** patterns
- Use **prepared statements** for queries
- Test **authentication flows**
- Ensure **data validation**

## Questions or Help

- **Create an issue** for bugs or feature requests
- **Join discussions** for general questions
- **Contact maintainers** for urgent issues

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to making campus transportation better! 🚗✨