require 'sinatra'
require 'rubygems'
require 'mongo'

include Mongo

get '/' do
    "Hello from Cloud Foundry"

    @client = MongoClient.new('localhost', 27017)
    @db = @client['sample-db']
    @coll = @db['test']

    3.times do |i|
        @coll.insert({'a'=> i+1})
    end

    puts "There are #{@coll.count} records"
end
