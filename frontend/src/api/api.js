import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload-file', formData);
    return response.data;
};

export const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await api.post('/upload-files', formData);
    return response.data;
};

export const rankApplications = async (candidateFiles, jobDescriptionFile) => {
    const formData = new FormData();
    candidateFiles.forEach((file) => formData.append('files', file));
    if (jobDescriptionFile) {
        formData.append('job_description_file', jobDescriptionFile);
    }
    const response = await api.post('/rank-applications', formData);
    return response.data;
};

export const streamRankApplications = async (
    candidateFiles,
    jobDescriptionFile,
    onChunk,
) => {
    const formData = new FormData();
    candidateFiles.forEach((file) => formData.append('files', file));
    if (jobDescriptionFile) {
        formData.append('job_description_file', jobDescriptionFile);
    }

    const response = await fetch('http://localhost:8000/rank-applications/stream', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let message = 'Streaming request failed.';
        try {
            const errorBody = await response.json();
            message = errorBody?.detail ?? message;
        } catch {
            // Keep default message when response is not JSON.
        }
        throw new Error(message);
    }

    if (!response.body) {
        throw new Error('Streaming response body is not available.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        onChunk(decoder.decode(value, { stream: true }));
    }

    const tail = decoder.decode();
    if (tail) {
        onChunk(tail);
    }
};