jQuery(document).ready(function($) {
    // Fetch endpoints via AJAX
    $.ajax({
        url: selectiveEndpointAuth.ajax_url,
        method: 'POST',
        data: {
            action: 'get_rest_endpoints',
            nonce: selectiveEndpointAuth.nonce
        },
        success: function(response) {
            if (response.success && response.data) {
				const $endpointList = $('#endpoint-list');
                const $searchInput = $('#endpoint-search');
                const $clearButton = $('#clear-search');
                const $publicEndpointsInput = $('#public-endpoints-input');

                // Use current public endpoints as-is (assuming they already have /wp-json/)
                const currentPublicEndpoints = selectiveEndpointAuth.current_public_endpoints || [];

                const namespaces = Object.keys(response.data);

                namespaces.forEach(namespace => {
					const endpoints = response.data[namespace];

					const $namespaceContainer = $('<div>', {
						class: 'namespace-container',
						'data-namespace': namespace
					});

					const $namespaceCheckbox = $('<input>', {
						type: 'checkbox',
						class: 'namespace-checkbox',
						id: 'namespace-' + btoa(namespace),
						checked: true
					});

					const $namespaceHeader = $('<label>', {
						class: 'namespace-header',
						for: 'namespace-' + btoa(namespace),
						text: namespace
					});

					const $endpointsList = $('<div>', {
						class: 'endpoints-list'
					});

					let anyEndpointsUnchecked = false;

					// Initialize an array to store the group names and a map for group counts
					const groups = {};
					const noGroupEndpoints = [];

					const groupCounts = {};

					// First loop to count groups
					endpoints.forEach(endpoint => {
						const groupName = endpoint.route.split(namespace)[1]?.split("/")[1];
						if (groupName) {
							groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
						}
					});

					// Second loop to add group names to the groups array or categorize as "no group"
					endpoints.forEach(endpoint => {
						const groupName = endpoint.route.split(namespace)[1]?.split("/")[1];
						const groupCount = groupCounts[groupName];

						// If this group has more than one endpoint, add it to the groups object
						if (groupCount > 1 && groupName) {
							if (!groups[groupName]) {
								groups[groupName] = [];
							}
							groups[groupName].push(endpoint);
						} else {
							// Otherwise, add this endpoint to the "no group" list
							noGroupEndpoints.push(endpoint);
						}
					});

					// Create a group container for each group
					Object.keys(groups).forEach(group => {
						const $groupContainer = $('<div>', {
							class: 'group-container',
							'data-group': group
						});

						const $groupHeader = $('<div>', {
							class: 'group-header',
							text: group
						});

						const $groupEndpointsList = $('<div>', {
							class: 'group-endpoints-list'
						});

						// Append the group header and endpoints list to the group container
						$groupContainer.append($groupHeader).append($groupEndpointsList);

						// Append the group container to the endpoints list
						$endpointsList.append($groupContainer);
					});

					// Now, loop through the endpoints and append them to their respective group container
					endpoints.forEach(endpoint => {
						const $endpointItem = $('<div>', {
							class: 'endpoint-item',
							'data-route': endpoint.route
						});

						// IMPORTANT: Prepend /wp-json/ to the route
						const fullRoute = '/wp-json' + endpoint.route;

						// Extract group name from the route
						const groupName = endpoint.route.split(namespace)[1]?.split("/")[1];

						// Check if this endpoint is in the public endpoints list
						const isEndpointPublic = currentPublicEndpoints.some(item => {
							const reformattedItem = item.replace("/wp-json", "/wp-json/wp");
							return reformattedItem === fullRoute;
						});

						const $checkbox = $('<input>', {
							type: 'checkbox',
							class: 'endpoint-checkbox',
							id: 'endpoint-' + btoa(endpoint.route),
							value: fullRoute,  // Use full route with /wp-json/
							checked: !isEndpointPublic  // Unchecked means public
						});

						if (isEndpointPublic) {
							anyEndpointsUnchecked = true;
						}

						const $label = $('<label>', {
							for: 'endpoint-' + btoa(endpoint.route),
							text: endpoint.route
						});

						$endpointItem.append($checkbox).append($label);

						// Append the endpoint item to the correct group container or to the no-group list
						if (groupName && groups[groupName]) {
							const $groupEndpointsList = $endpointsList.find(`.group-container[data-group="${groupName}"] .group-endpoints-list`);
							if ($groupEndpointsList.length) {
								$groupEndpointsList.append($endpointItem);
							}
						} else {
							$endpointsList.append($endpointItem);  // For endpoints with no group
						}
					});

					$namespaceCheckbox.prop('checked', !anyEndpointsUnchecked);

					$namespaceContainer
						.append($('<div>')
							.append($namespaceCheckbox)
							.append($namespaceHeader)
						)
						.append($endpointsList);

					$endpointList.append($namespaceContainer);
				});

				
				// Fuzzy search utility
				function fuzzyMatch(searchTerm, text) {
					searchTerm = searchTerm.toLowerCase();
					text = text.toLowerCase();
					let currentIndex = 0;

					for (let i = 0; i < text.length && currentIndex < searchTerm.length; i++) {
						if (text[i] === searchTerm[currentIndex]) {
							currentIndex++;
						}
					}

					return currentIndex === searchTerm.length;
				}
				
				// Real-time filtering
                $searchInput.on('input', function() {
                    const searchTerm = $searchInput.val();

                    // Show or hide the clear button based on the input
                    if (searchTerm) {
                        $clearButton.show();
                    } else {
                        $clearButton.hide();
                    }

                    $endpointList.find('.endpoint-item').each(function() {
                        const $endpointItem = $(this);
                        const routeText = $endpointItem.find('label').text();  // Get the text of the endpoint label

                        if (fuzzyMatch(searchTerm, routeText)) {
                            $endpointItem.show();
                        } else {
                            $endpointItem.hide();
                        }
                    });
                });

                // Clear search input when the clear button is clicked
                $clearButton.on('click', function() {
                    $searchInput.val('');
                    $clearButton.hide();
                    $endpointList.find('.endpoint-item').show(); // Show all items again
                });

                // Namespace checkbox toggle
                $endpointList.on('change', '.namespace-checkbox', function() {
                    const $namespaceContainer = $(this).closest('.namespace-container');
                    const isChecked = $(this).prop('checked');
                    
                    $namespaceContainer.find('.endpoint-checkbox')
                        .prop('checked', isChecked)
                        .trigger('change');
                });

                // Individual endpoint checkbox change handler
                $endpointList.on('change', '.endpoint-checkbox', function() {
                    const $namespaceContainer = $(this).closest('.namespace-container');
                    const $namespaceCheckbox = $namespaceContainer.find('.namespace-checkbox');
                    const $allEndpointCheckboxes = $namespaceContainer.find('.endpoint-checkbox');
                    
                    const allChecked = $allEndpointCheckboxes.toArray().every(cb => cb.checked);
                    
                    $namespaceCheckbox.prop('checked', allChecked);

                    // Collect UNCHECKED endpoints (public endpoints)
                    const publicEndpoints = $('.endpoint-checkbox:not(:checked)')
                        .map(function() { return this.value })
                        .get();
						
                    $publicEndpointsInput.val(publicEndpoints.join(','));
                });
            }
			else {
                 // Handle error case
                console.error('Failed to fetch endpoints', response);
                $('#endpoint-list').html('<p>Failed to load endpoints. Please try again.</p>');
            }
        },
        error: function(xhr, status, error) {
             // Handle AJAX error
            console.error('AJAX Error:', status, error);
            $('#endpoint-list').html('<p>Error loading endpoints. Please check the console.</p>');
        }
    });
});