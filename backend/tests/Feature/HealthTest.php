<?php

test('health endpoint returns ok status', function () {
    $response = $this->getJson('/api/health');

    $response->assertOk()
        ->assertJson(['status' => 'ok']);
});
