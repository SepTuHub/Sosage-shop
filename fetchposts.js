fetch('/posts')
    .then(response => response.json())
    .then(posts => {
        const postsContainer = document.querySelector('.posts');
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'product';
            postElement.innerHTML = `
                <a href="custompages/${post.title}.html">
                    ${post.imageFilename ? `<img src="custompages/images/${post.imageFilename}" alt="${post.title}">` : ''}
                </a>
                <h3>${post.title}</h3>
                <p>Цена: ${post.price} руб.</p> <!-- Обновлено -->
            `;
            postsContainer.appendChild(postElement);
        });
    })
    .catch(error => {
        console.error('Ошибка при загрузке постов:', error);
    });
