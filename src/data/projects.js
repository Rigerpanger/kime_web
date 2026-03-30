export const projects = [
    // --- MAIN CAMP (SERVICES) ---
    // The "City" cluster at the top/front
    {
        id: 'service-team',
        title: 'Creative Team',
        category: 'Services',
        type: 'SERVICE',
        // Central Top
        position: [0, 9, 2],
        rotation: [0, 0, 0],
        description: 'Our core team of visionaries, artists, and strategists.',
        items: []
    },
    {
        id: 'service-arvr',
        title: 'AR / VR',
        category: 'Development',
        type: 'SERVICE',
        // Slightly Left
        position: [-3, 8, 4],
        rotation: [0, -0.3, 0],
        description: 'Immersive augmented and virtual reality experiences.',
        items: []
    },
    {
        id: 'service-ai',
        title: 'AI Solutions',
        category: 'Development',
        type: 'SERVICE',
        // Slightly Right
        position: [3, 8, 4],
        rotation: [0, 0.3, 0],
        description: 'Neural networks, generative AI, and intelligent systems.',
        items: []
    },
    {
        id: 'service-cgi',
        title: 'CGI & VFX',
        category: 'Production',
        type: 'SERVICE',
        // Front Center
        position: [0, 7, 6],
        rotation: [0, 0, 0],
        description: 'High-end cinema graphics and visual effects.',
        items: []
    },

    // --- SATELLITE PROJECTS ---
    // Surrounding the main camp
    {
        id: 'stalingrad',
        title: 'Stalingrad',
        category: 'VR History',
        type: 'PROJECT',
        // Equator Right
        position: [8, 2, 5],
        rotation: [0, Math.PI / 4, 0],
        description: 'An immersive VR experience reconstructing the historic battle.',
        items: []
    },

    {
        id: 'neon-cyber',
        title: 'Neon Cyber',
        category: 'Web/Dev',
        type: 'PROJECT',
        // Back Right
        position: [5, 5, -8],
        rotation: [0, Math.PI, 0],
        description: 'Next-gen web applications ecosystem.',
        items: []
    }
];
