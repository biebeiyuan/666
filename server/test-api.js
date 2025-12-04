async function test() {
    try {
        console.log('Testing generate-scenario...');
        const response = await fetch('http://localhost:3001/api/generate-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                theme: 'cyberpunk_novel',
                difficulty: 'Normal'
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Success:', data);
        } else {
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

test();
