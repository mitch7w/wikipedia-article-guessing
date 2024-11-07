import { article_urls, article_names } from './articles.js';

class WikiGame {
    constructor() {
        this.score = 0;
        this.currentArticle = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('play-btn').addEventListener('click', () => this.startGame());
        document.getElementById('next-btn').addEventListener('click', () => this.loadNewArticle());
    }

    startGame() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        this.loadNewArticle();
    }

    async loadNewArticle() {
        document.getElementById('next-btn').classList.add('hidden');
        const randomIndex = Math.floor(Math.random() * article_urls.length);
        const articleUrl = article_urls[randomIndex];
        this.currentArticle = article_names[randomIndex];

        try {
            const articleContent = await this.fetchArticleContent(articleUrl);
            this.displayArticle(articleContent);
            this.displayOptions();
        } catch (error) {
            console.error('Error loading article:', error);
        }
    }

    async fetchArticleContent(url) {
        // Extract the title from the URL
        const title = url.split('/').pop().replace(/_/g, ' ');
        
        // Use a CORS proxy to bypass the CORS restriction
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = `${corsProxy}https://api.enterprise.wikimedia.com/v2/articles/${encodeURIComponent(title)}`;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const article = data.items[0];
                return article.article_body.slice(0, 500) + "...";
            } else {
                throw new Error('No article content found');
            }
        } catch (error) {
            console.error('Error fetching article:', error);
            // Fallback to the regular Wikipedia API if enterprise API fails
            return this.fetchFromRegularWikipedia(title);
        }
    }

    // Fallback method using regular Wikipedia API
    async fetchFromRegularWikipedia(title) {
        const apiUrl = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            return pages[pageId].extract;
        } catch (error) {
            console.error('Error fetching from Wikipedia:', error);
            return 'Error loading article content. Please try again.';
        }
    }

    displayArticle(content) {
        document.getElementById('article-content').innerHTML = `
            <p>${content}</p>
        `;
    }

    displayOptions() {
        const options = this.getRandomOptions();
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.checkAnswer(button, option));
            optionsContainer.appendChild(button);
        });
    }

    getRandomOptions() {
        const options = [this.currentArticle];
        while (options.length < 4) {
            const randomOption = article_names[Math.floor(Math.random() * article_names.length)];
            if (!options.includes(randomOption)) {
                options.push(randomOption);
            }
        }
        return this.shuffleArray(options);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    checkAnswer(button, selectedOption) {
        const allButtons = document.querySelectorAll('.option-btn');
        allButtons.forEach(btn => btn.disabled = true);

        if (selectedOption === this.currentArticle) {
            button.classList.add('correct');
            this.score++;
            document.getElementById('score').textContent = this.score;
        } else {
            button.classList.add('incorrect');
            // Show the correct answer
            allButtons.forEach(btn => {
                if (btn.textContent === this.currentArticle) {
                    btn.classList.add('correct');
                }
            });
        }

        document.getElementById('next-btn').classList.remove('hidden');
    }
}

// Initialize the game
new WikiGame(); 