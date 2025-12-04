import axios from 'axios';

async function test() {
    try {
        console.log('Testing generate-scenario...');
        const response = await axios.post('http://localhost:3001/api/generate-scenario', {
            theme: 'cyberpunk_novel',
            difficulty: 'Normal'
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

test();
