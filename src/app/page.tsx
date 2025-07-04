/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const App = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());

    const [board, setBoard] = useState(Array(9).fill(null)); 
    const [xIsNext, setXIsNext] = useState(true); 
    const [status, setStatus] = useState('Next player: X'); 
    const [winner, setWinner] = useState<'X' | 'O' | 'Draw' | null>(null); 
    const [winningLine, setWinningLine] = useState<number[] | null>(null); 
    const [isDarkMode, setIsDarkMode] = useState(true); 
    const [playerXScore, setPlayerXScore] = useState(0); 
    const [playerOScore, setPlayerOScore] = useState(0); 

    // Constants for the game board and piece dimensions
    const CELL_SIZE = 2; 
    const GAP_SIZE = 0.1; 
    const BOARD_SIZE = CELL_SIZE * 3 + GAP_SIZE * 2; 

    // Define colors for dark and light modes
    const colors = {
        dark: {
            background: 0x1a1a2e, 
            plane: 0x2c3e50,     
            line: 0xecf0f1,       
            basePlane: 0x34495e, 
            xPiece: 0xe74c3c,    
            oPiece: 0x3498db,     
            mainBgGradient: 'from-purple-900 to-indigo-900',
            uiBg: 'bg-gray-800',
            uiText: 'text-white',
            uiBgOpacity: 'bg-opacity-70',
            titleGradient: 'from-teal-400 to-blue-500',
            paragraphText: 'text-gray-300'
        },
        light: {
            background: 0xe0f7fa, 
            plane: 0xbbdefb,     
            line: 0x424242,     
            basePlane: 0x90a4ae,  
            xPiece: 0xc0392b,  
            oPiece: 0x2980b9,   
            mainBgGradient: 'from-blue-100 to-cyan-100',
            uiBg: 'bg-white',
            uiText: 'text-gray-800',
            uiBgOpacity: 'bg-opacity-80',
            titleGradient: 'from-blue-600 to-indigo-800',
            paragraphText: 'text-gray-600'
        }
    };

    // Get current theme colors
    const currentTheme = isDarkMode ? colors.dark : colors.light;

    // Function to calculate the winner of the game
    const calculateWinner = useCallback((squares: unknown[]) => {
        // All possible winning lines (rows, columns, diagonals)
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6], // Diagonals
        ];

        // Check each line for a winner
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: lines[i] }; // Return the winner and the winning line
            }
        }

        // If no winner, check for a draw
        if (squares.every((square) => square !== null)) {
            return { winner: 'Draw', line: null };
        }

        return null; // No winner yet
    }, []);

    // Function to reset the view to its initial position
    const resetView = useCallback(() => {
        if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(0, 5, 10); // Initial camera position
            controlsRef.current.target.set(0, 0, 0); // Look at the center of the board
            controlsRef.current.update();
        }
    }, []);

    // Effect hook for initializing the Three.js scene
    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(currentTheme.background); 

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); 
        camera.position.set(0, 5, 10); // Initial camera position

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        // Set renderer size based on parent container's dimensions
        let parentElement: HTMLElement | null = null;
        if (mountRef.current) {
            parentElement = (mountRef.current as HTMLElement).parentElement;
        }
        if (parentElement) {
            renderer.setSize(parentElement.clientWidth, parentElement.clientHeight);
            camera.aspect = parentElement.clientWidth / parentElement.clientHeight;
            camera.updateProjectionMatrix();
        }
        if (mountRef.current) {
            (mountRef.current as HTMLElement).appendChild(renderer.domElement);
        }

        // OrbitControls for camera interaction
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Enable smooth camera movement
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 20;
        controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the board

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
        scene.add(ambientLight);

        // Main directional light (slightly stronger)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Secondary directional light (for more dynamic shadows/highlights)
        const directionalLight2 = new THREE.DirectionalLight(0xffeedd, 0.5); 
        directionalLight2.position.set(-8, 5, -5);
        scene.add(directionalLight2);

        // Store scene components in refs
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update(); 
            renderer.render(scene, camera); 
        };
        animate();

        // Handle window resizing
        const handleResize = () => {
            let parent: HTMLElement | null = null;
            if (mountRef.current) {
                parent = (mountRef.current as HTMLElement).parentElement;
            }
            if (parent) {
                camera.aspect = parent.clientWidth / parent.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(parent.clientWidth, parent.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                (mountRef.current as HTMLElement).removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose();
        };
    }, [currentTheme.background]); 

    // Function to create the 3D Tic Tac Toe grid
    const createGrid = useCallback(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Remove existing grid and winning line elements
        const objectsToRemove = scene.children.filter(child =>
            (child as any).userData && ((child as any).userData.isGrid || (child as any).userData.isWinningLine)
        );
        objectsToRemove.forEach((child) => {
            scene.remove(child);
            // Dispose geometry if present
            if ((child as THREE.Mesh).geometry) {
                ((child as THREE.Mesh).geometry as THREE.BufferGeometry).dispose?.();
            }
            // Dispose material if present
            if ((child as THREE.Mesh).material) {
                // Material can be an array or a single material
                const material = (child as THREE.Mesh).material;
                if (Array.isArray(material)) {
                    material.forEach(mat => mat.dispose?.());
                } else {
                    material.dispose?.();
                }
            }
        });

        // Create the board planes (cells)
        const planeGeometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: currentTheme.plane, 
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.4
        });

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const plane = new THREE.Mesh(planeGeometry, planeMaterial.clone());
                plane.position.set(
                    (j - 1) * (CELL_SIZE + GAP_SIZE),
                    (1 - i) * (CELL_SIZE + GAP_SIZE),
                    0
                );
                plane.rotation.x = Math.PI / 2;
                plane.userData.isGrid = true;
                plane.userData.index = i * 3 + j;
                scene.add(plane);
            }
        }

        // Create grid lines
        const lineMaterial = new THREE.LineBasicMaterial({
            color: currentTheme.line,
            linewidth: 4
        });

        // Vertical lines
        for (let i = 0; i < 2; i++) {
            const points = [];
            points.push(new THREE.Vector3((i - 0.5) * (CELL_SIZE + GAP_SIZE) * 2, BOARD_SIZE / 2, 0));
            points.push(new THREE.Vector3((i - 0.5) * (CELL_SIZE + GAP_SIZE) * 2, -BOARD_SIZE / 2, 0));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            line.userData.isGrid = true;
            scene.add(line);
        }

        // Horizontal lines
        for (let i = 0; i < 2; i++) {
            const points = [];
            points.push(new THREE.Vector3(-BOARD_SIZE / 2, (i - 0.5) * (CELL_SIZE + GAP_SIZE) * 2, 0));
            points.push(new THREE.Vector3(BOARD_SIZE / 2, (i - 0.5) * (CELL_SIZE + GAP_SIZE) * 2, 0));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            line.userData.isGrid = true;
            scene.add(line);
        }

        // Add a base plane for visual grounding
        const basePlaneGeometry = new THREE.PlaneGeometry(BOARD_SIZE + 2, BOARD_SIZE + 2);
        const basePlaneMaterial = new THREE.MeshStandardMaterial({
            color: currentTheme.basePlane, 
            roughness: 0.6,
            metalness: 0.3
        });
        const basePlane = new THREE.Mesh(basePlaneGeometry, basePlaneMaterial);
        basePlane.position.z = -0.1;
        basePlane.rotation.x = Math.PI / 2;
        basePlane.userData.isGrid = true;
        scene.add(basePlane);

    }, [currentTheme]); 

    // Effect hook to create the grid when the component mounts
    useEffect(() => {
        createGrid();
    }, [createGrid]);

    // Function to create a 3D 'X' piece
    const createX = useCallback(() => {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
            color: currentTheme.xPiece, // Dynamic X piece color
            roughness: 0.3,
            metalness: 0.6
        });

        const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, CELL_SIZE * 1.2, 32);

        const bar1 = new THREE.Mesh(cylinderGeometry, material);
        bar1.rotation.z = Math.PI / 4;
        group.add(bar1);

        const bar2 = new THREE.Mesh(cylinderGeometry, material);
        bar2.rotation.z = -Math.PI / 4;
        group.add(bar2);

        return group;
    }, [currentTheme.xPiece]); // Re-run if X piece color changes

    // Function to create a 3D 'O' piece
    const createO = useCallback(() => {
        const material = new THREE.MeshStandardMaterial({
            color: currentTheme.oPiece, // Dynamic O piece color
            roughness: 0.3,
            metalness: 0.6
        });
        const torusGeometry = new THREE.TorusGeometry(0.8, 0.2, 30, 60);
        const torus = new THREE.Mesh(torusGeometry, material);
        torus.rotation.x = Math.PI / 2;
        return torus;
    }, [currentTheme.oPiece]); // Re-run if O piece color changes

    // Function to place a piece on the board in 3D
    const placePiece = useCallback((index: number, player: string) => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Calculate 3D position from 1D index
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = (col - 1) * (CELL_SIZE + GAP_SIZE);
        const y = (1 - row) * (CELL_SIZE + GAP_SIZE);
        const z = 0.5; // Slightly above the board

        let piece;
        if (player === 'X') {
            piece = createX();
        } else {
            piece = createO();
        }
        piece.position.set(x, y, z);
        piece.userData.isPiece = true;
        scene.add(piece);
    }, [createX, createO]);

    // Effect hook to update the 3D pieces when the board state changes
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Remove all existing pieces
        const piecesToRemove = scene.children.filter(child => 
            (child as any).userData?.isPiece || (child as any).userData?.isWinningLine
        );
        piecesToRemove.forEach((child) => {
            scene.remove(child);
            // Dispose geometry if present
            if ((child as THREE.Mesh).geometry) {
                ((child as THREE.Mesh).geometry as THREE.BufferGeometry).dispose?.();
            }
            // Dispose material if present
            if ((child as THREE.Mesh).material) {
                const material = (child as THREE.Mesh).material;
                if (Array.isArray(material)) {
                    material.forEach(mat => mat.dispose?.());
                } else {
                    material.dispose?.();
                }
            }
        });

        // Add new pieces based on the current board state
        board.forEach((player, index) => {
            if (player) {
                placePiece(index, player);
            }
        });

        // Highlight winning line if a winner exists
        if (winningLine && winner !== 'Draw') {
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xfff000, linewidth: 5 });
            const points: THREE.Vector3[] = [];

            // Get positions of the winning cells
            winningLine.forEach((index: number) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                const x = (col - 1) * (CELL_SIZE + GAP_SIZE);
                const y = (1 - row) * (CELL_SIZE + GAP_SIZE);
                points.push(new THREE.Vector3(x, y, 0.6)); 
            });

            // Create a line connecting the winning cells
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            line.userData.isWinningLine = true;
            scene.add(line);
        }

    }, [board, placePiece, winningLine, winner]);

    // Function to handle a player's move
    const makeMove = useCallback((index: number) => {
        if (board[index] === null) {
            const newBoard = board.slice();
            newBoard[index] = xIsNext ? 'X' : 'O';
            setBoard(newBoard);
            setXIsNext(!xIsNext);
            return true;
        }
        return false; 
    }, [board, xIsNext]);

    // Handle click events on the 3D board
    const handleClick = useCallback((event: { clientX: number; clientY: number; }) => {
        if (winner) {
            return;
        }

        // Get the bounding rectangle of the canvas element
        if (!rendererRef.current) {
            return;
        }
        const canvasBounds = rendererRef.current.domElement.getBoundingClientRect();

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        mouseRef.current.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

        // Update the raycaster with the camera and mouse position
        if (cameraRef.current) {
            raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        } else {
            return;
        }

        // Find intersections with grid cells
        if (!sceneRef.current) {
            return;
        }
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children);

        for (let i = 0; i < intersects.length; i++) {
            const intersectedObject = intersects[i].object;
            // Check if the intersected object is a grid cell
            if (intersectedObject.userData.isGrid && intersectedObject.userData.index !== undefined) {
                const index = intersectedObject.userData.index;
                makeMove(index);
                break;
            }
        }
    }, [winner, makeMove]);

    // Effect hook to add and remove click event listener
    useEffect(() => {
        const canvas = rendererRef.current?.domElement;
        if (canvas) {
            canvas.addEventListener('click', handleClick);
        }
        return () => {
            if (canvas) {
                canvas.removeEventListener('click', handleClick);
            }
        };
    }, [handleClick]);

    // Effect hook to handle game status updates and score
    useEffect(() => {
        const result = calculateWinner(board);
        if (result) {
            const winnerValue = result.winner;
            if (winnerValue === 'X' || winnerValue === 'O' || winnerValue === 'Draw') {
                setWinner(winnerValue);
            } else {
                setWinner(null);
            }
            setWinningLine(result.line);
            if (winnerValue === 'Draw') {
                setStatus('Game: Draw!');
            } else if (winnerValue === 'X' || winnerValue === 'O') {
                setStatus(`Winner: ${winnerValue}!`);
                // Increment score for the winner
                if (winnerValue === 'X') {
                    setPlayerXScore(prevScore => prevScore + 1);
                } else if (winnerValue === 'O') {
                    setPlayerOScore(prevScore => prevScore + 1);
                }
            }
        } else {
            setStatus(`Next player: ${xIsNext ? 'X' : 'O'}`);
        }
    }, [board, xIsNext, calculateWinner]);

    // Function to start a new round (resets board, but keeps scores)
    const startNewRound = useCallback(() => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
        setWinner(null);
        setWinningLine(null);
        setStatus('Next player: X');
        createGrid(); 
        resetView();
    }, [createGrid, resetView]);

    // Function to reset scores and start a new game
    const resetScoresAndGame = useCallback(() => {
        setPlayerXScore(0);
        setPlayerOScore(0);
        startNewRound(); 
    }, [startNewRound]);

    // Function to toggle dark/light mode
    const toggleTheme = useCallback(() => {
        setIsDarkMode(prevMode => !prevMode);
    }, []);

    return (
        <div className="relative w-screen h-screen overflow-hidden font-inter flex flex-row bg-gradient-to-br from-black via-gray-900 to-gray-800">
            {/* Left Panel for 3D Canvas */}
            <div className="relative w-3/5 h-full">
                <div ref={mountRef} className="absolute inset-0 z-0" />
            </div>
    
            {/* Right Panel for Game UI Overlay */}
            <div className="w-2/5 h-full p-6 max-w-[500px] mx-auto shadow-2xl flex flex-col items-center space-y-6 overflow-y-auto backdrop-blur-md bg-opacity-70 text-white">
                <h1 className="text-4xl text-center sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 mb-4 pb-7 animate-pulse">
                    3D Tic Tac Toe
                </h1>
    
                <div className="text-2xl sm:text-3xl font-semibold tracking-wide text-center drop-shadow-sm">
                    {status}
                </div>
    
                <div className="flex justify-around w-full text-xl sm:text-2xl font-bold">
                    <span className="text-red-400 drop-shadow">Player X: {playerXScore}</span>
                    <span className="text-blue-400 drop-shadow">Player O: {playerOScore}</span>
                </div>
    
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <button onClick={startNewRound} className="px-6 py-3 bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:brightness-110 hover:scale-105 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-500">
                        New Round
                    </button>
                    <button onClick={resetScoresAndGame} className="px-6 py-3 bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-md hover:brightness-110 hover:scale-105 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-400">
                        Reset Scores
                    </button>
                    <button onClick={resetView} className="px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:brightness-110 hover:scale-105 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-400">
                        Reset View
                    </button>
                    <button onClick={toggleTheme} className={`px-6 py-3 font-bold rounded-xl shadow-md hover:scale-105 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-4 ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white focus:ring-gray-400' : 'bg-gradient-to-br from-yellow-300 to-orange-400 text-gray-900 focus:ring-yellow-400'}`}> 
                        {isDarkMode ? 'Light Mode ☀️' : 'Dark Mode 🌙'}
                    </button>
                </div>
    
                {winner && winner !== 'Draw' && (
                    <div className="mt-4 text-3xl sm:text-4xl font-bold text-yellow-300 animate-bounce drop-shadow-lg">
                        {winner === 'X' ? '🎉 X Wins! 🎉' : '🎉 O Wins! 🎉'}
                    </div>
                )}
    
                {winner === 'Draw' && (
                    <div className="mt-4 text-3xl sm:text-4xl font-bold text-gray-300 drop-shadow-md">
                        It&apos;s a Draw!
                    </div>
                )}
    
                <p className="text-sm mt-4 text-center px-4 text-gray-300">
                    Click on a cell to place your mark. Drag to rotate the 3D board.
                </p>
            </div>
        </div>
    );
    
};

export default App;
