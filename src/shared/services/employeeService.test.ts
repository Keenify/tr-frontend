import axios from 'axios';
import { jest } from '@jest/globals';
import { getEmployeeData, getEmployeeOnboardingStatus } from './employeeService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Employee Service', () => {
    const email = 'test@example.com';
    const mockEmployeeData = { email, completed_sign_up_sequence: true };

    beforeEach(() => {
        mockedAxios.get.mockClear();
    });

    it('should fetch employee data by email', async () => {
        // This test does not talk to the real backend server.
        // It tests that the getEmployeeData function correctly calls the axios.get method
        // with the expected URL and headers, and that it returns the expected data.
        mockedAxios.get.mockResolvedValue({ data: mockEmployeeData });

        const data = await getEmployeeData(email);

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `https://tr-backend-production.up.railway.app/employees/${encodeURIComponent(email)}`,
            { headers: { 'Accept': 'application/json' } }
        );
        expect(data).toEqual(mockEmployeeData);
    });

    it('should fetch the onboarding status of an employee', async () => {
        // This test does not talk to the real backend server.
        // It tests that the getEmployeeOnboardingStatus function correctly processes the data
        // returned by the mocked axios.get method.
        mockedAxios.get.mockResolvedValue({ data: mockEmployeeData });

        const status = await getEmployeeOnboardingStatus(email);

        expect(status).toBe(true);
    });

    it('should throw an error if fetching employee data fails', async () => {
        // This test does not talk to the real backend server.
        // It tests that the getEmployeeData function correctly handles errors thrown by axios.get.
        mockedAxios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getEmployeeData(email)).rejects.toThrow('Failed to fetch employee data');
    });
});