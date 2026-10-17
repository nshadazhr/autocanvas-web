import api from '../axios';
import { Voice } from './audio-stories.types';

export const getVoices = async (): Promise<Voice[]> => {
	const response = await api.get<Voice[]>('/voices');
	return response.data;
};
